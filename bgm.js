(() => {
  "use strict";

  const DEFAULT_TEMPO_MICROSECONDS = 500000;
  const SCHEDULE_AHEAD_SECONDS = 0.4;
  const SCHEDULE_INTERVAL_MS = 80;
  const START_DELAY_SECONDS = 0.16;
  const MIN_GAIN = 0.0001;
  const SPACE_ECHO_DELAY_SECONDS = 0.24;
  const SPACE_ECHO_FEEDBACK = 0.17;
  const SPACE_ECHO_WET_LEVEL = 0.22;

  function decodeBase64(base64) {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
  }

  function readChunkName(bytes, offset) {
    return String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );
  }

  function readVariableLength(bytes, cursor, trackEnd) {
    let value = 0;

    for (let byteIndex = 0; byteIndex < 4; byteIndex += 1) {
      if (cursor.offset >= trackEnd) {
        throw new Error("Unexpected end of MIDI variable-length value.");
      }

      const byte = bytes[cursor.offset];
      cursor.offset += 1;
      value = (value << 7) | (byte & 0x7f);

      if ((byte & 0x80) === 0) {
        return value;
      }
    }

    throw new Error("Invalid MIDI variable-length value.");
  }

  function buildTempoSegments(tempoEvents, ticksPerQuarter) {
    const orderedEvents = [...tempoEvents].sort(
      (left, right) => left.tick - right.tick || left.order - right.order
    );
    const segments = [
      {
        tick: 0,
        seconds: 0,
        microseconds: DEFAULT_TEMPO_MICROSECONDS,
      },
    ];

    for (const event of orderedEvents) {
      const previous = segments[segments.length - 1];

      if (event.tick === previous.tick) {
        previous.microseconds = event.microseconds;
        continue;
      }

      const seconds =
        previous.seconds +
        ((event.tick - previous.tick) * previous.microseconds) /
          ticksPerQuarter /
          1000000;

      segments.push({
        tick: event.tick,
        seconds,
        microseconds: event.microseconds,
      });
    }

    return segments;
  }

  function tickToSeconds(tick, tempoSegments, ticksPerQuarter) {
    let low = 0;
    let high = tempoSegments.length - 1;

    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (tempoSegments[middle].tick <= tick) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }

    const segment = tempoSegments[low];
    return (
      segment.seconds +
      ((tick - segment.tick) * segment.microseconds) /
        ticksPerQuarter /
        1000000
    );
  }

  function parseMidi(base64) {
    const bytes = decodeBase64(base64);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    if (bytes.length < 14 || readChunkName(bytes, 0) !== "MThd") {
      throw new Error("BGM data is not a Standard MIDI File.");
    }

    const headerLength = view.getUint32(4);
    const trackCount = view.getUint16(10);
    const division = view.getUint16(12);

    if ((division & 0x8000) !== 0) {
      throw new Error("SMPTE-timed MIDI is not supported.");
    }

    const noteTicks = [];
    const tempoEvents = [];
    let eventOrder = 0;
    let maxTick = 0;
    let offset = 8 + headerLength;

    for (let trackIndex = 0; trackIndex < trackCount; trackIndex += 1) {
      if (offset + 8 > bytes.length || readChunkName(bytes, offset) !== "MTrk") {
        throw new Error("MIDI track header is missing.");
      }

      const trackLength = view.getUint32(offset + 4);
      const trackEnd = offset + 8 + trackLength;
      const cursor = { offset: offset + 8 };
      const activeNotes = new Map();
      let tick = 0;
      let runningStatus = null;

      if (trackEnd > bytes.length) {
        throw new Error("MIDI track extends beyond the available data.");
      }

      while (cursor.offset < trackEnd) {
        tick += readVariableLength(bytes, cursor, trackEnd);
        maxTick = Math.max(maxTick, tick);

        let status = bytes[cursor.offset];
        if (status >= 0x80) {
          cursor.offset += 1;
          if (status < 0xf0) {
            runningStatus = status;
          }
        } else if (runningStatus !== null) {
          status = runningStatus;
        } else {
          throw new Error("MIDI running status has no preceding status byte.");
        }

        if (status === 0xff) {
          if (cursor.offset >= trackEnd) {
            throw new Error("MIDI meta event is incomplete.");
          }

          const type = bytes[cursor.offset];
          cursor.offset += 1;
          const length = readVariableLength(bytes, cursor, trackEnd);

          if (cursor.offset + length > trackEnd) {
            throw new Error("MIDI meta event exceeds its track.");
          }

          if (type === 0x51 && length === 3) {
            tempoEvents.push({
              tick,
              microseconds:
                (bytes[cursor.offset] << 16) |
                (bytes[cursor.offset + 1] << 8) |
                bytes[cursor.offset + 2],
              order: eventOrder,
            });
          }

          eventOrder += 1;
          cursor.offset += length;
          continue;
        }

        if (status === 0xf0 || status === 0xf7) {
          const length = readVariableLength(bytes, cursor, trackEnd);
          cursor.offset += length;
          if (cursor.offset > trackEnd) {
            throw new Error("MIDI system event exceeds its track.");
          }
          continue;
        }

        const messageType = status & 0xf0;
        const channel = status & 0x0f;
        const dataLength =
          messageType === 0xc0 || messageType === 0xd0 ? 1 : 2;

        if (cursor.offset + dataLength > trackEnd) {
          throw new Error("MIDI channel event is incomplete.");
        }

        const data1 = bytes[cursor.offset];
        const data2 = dataLength === 2 ? bytes[cursor.offset + 1] : 0;
        cursor.offset += dataLength;

        const isNoteOn = messageType === 0x90 && data2 > 0;
        const isNoteOff =
          messageType === 0x80 || (messageType === 0x90 && data2 === 0);
        if (!isNoteOn && !isNoteOff) {
          continue;
        }

        const key = channel + ":" + data1;
        const pending = activeNotes.get(key) || [];

        if (isNoteOn) {
          pending.push({ tick, velocity: data2 });
          activeNotes.set(key, pending);
          continue;
        }

        const startedNote = pending.shift();
        if (startedNote === undefined) {
          continue;
        }

        if (pending.length === 0) {
          activeNotes.delete(key);
        }

        noteTicks.push({
          midi: data1,
          velocity: startedNote.velocity / 127,
          startTick: startedNote.tick,
          endTick: Math.max(startedNote.tick + 1, tick),
        });
      }

      for (const [key, pending] of activeNotes) {
        const midi = Number(key.split(":")[1]);
        for (const startedNote of pending) {
          noteTicks.push({
            midi,
            velocity: startedNote.velocity / 127,
            startTick: startedNote.tick,
            endTick: Math.max(startedNote.tick + 1, maxTick),
          });
        }
      }

      offset = trackEnd;
    }

    const tempoSegments = buildTempoSegments(tempoEvents, division);
    const notes = noteTicks
      .map((note) => {
        const time = tickToSeconds(note.startTick, tempoSegments, division);
        const endTime = tickToSeconds(note.endTick, tempoSegments, division);
        return {
          midi: note.midi,
          velocity: note.velocity,
          time,
          duration: Math.max(0.03, endTime - time),
        };
      })
      .sort((left, right) => left.time - right.time || left.midi - right.midi);

    const lastNoteEnd = notes.reduce(
      (latest, note) => Math.max(latest, note.time + note.duration),
      0
    );
    const trackEndSeconds = tickToSeconds(maxTick, tempoSegments, division);

    return {
      notes,
      duration: Math.max(lastNoteEnd, trackEndSeconds) + 0.35,
    };
  }

  function findFirstNoteAtOrAfter(notes, time) {
    let low = 0;
    let high = notes.length;

    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (notes[middle].time < time) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }

    return low;
  }

  class MidiBgmPlayer {
    constructor(base64, options = {}) {
      this.song = parseMidi(base64);
      this.volume = options.volume ?? 0.22;
      this.context = null;
      this.masterGain = null;
      this.effectNodes = [];
      this.periodicWave = null;
      this.schedulerId = null;
      this.loopStartTime = 0;
      this.noteIndex = 0;
      this.pausedAt = 0;
      this.isPlaying = false;
      this.activeOscillators = new Set();
    }

    get info() {
      return {
        noteCount: this.song.notes.length,
        duration: this.song.duration,
      };
    }

    start(context, options = {}) {
      if (
        this.isPlaying ||
        context === null ||
        context.state === "closed" ||
        this.song.notes.length === 0
      ) {
        return;
      }

      if (options.restart === true) {
        this.pausedAt = 0;
      }

      this.context = context;
      this.masterGain = context.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, context.currentTime);

      // 원곡의 대위법은 선명하게 남기면서 피아노 느낌을 없애는 우주형 공간계 체인.
      // 짧은 에코는 전역 노드 하나만 공유해 음표마다 리버브 노드를 만들지 않는다.
      const toneFilter = context.createBiquadFilter();
      const dryGain = context.createGain();
      const echoDelay = context.createDelay(0.8);
      const echoFeedback = context.createGain();
      const echoWetGain = context.createGain();

      toneFilter.type = "lowpass";
      toneFilter.frequency.setValueAtTime(4200, context.currentTime);
      toneFilter.Q.setValueAtTime(0.8, context.currentTime);
      dryGain.gain.setValueAtTime(0.82, context.currentTime);
      echoDelay.delayTime.setValueAtTime(
        SPACE_ECHO_DELAY_SECONDS,
        context.currentTime
      );
      echoFeedback.gain.setValueAtTime(
        SPACE_ECHO_FEEDBACK,
        context.currentTime
      );
      echoWetGain.gain.setValueAtTime(
        SPACE_ECHO_WET_LEVEL,
        context.currentTime
      );

      this.masterGain.connect(toneFilter);
      toneFilter.connect(dryGain);
      dryGain.connect(context.destination);
      toneFilter.connect(echoDelay);
      echoDelay.connect(echoWetGain);
      echoWetGain.connect(context.destination);
      echoDelay.connect(echoFeedback);
      echoFeedback.connect(echoDelay);
      this.effectNodes = [
        this.masterGain,
        toneFilter,
        dryGain,
        echoDelay,
        echoFeedback,
        echoWetGain,
      ];

      const real = new Float32Array(9);
      const imaginary = new Float32Array([
        0,
        1,
        0.08,
        0.28,
        0.04,
        0.18,
        0.03,
        0.1,
        0.02,
      ]);
      this.periodicWave = context.createPeriodicWave(real, imaginary);

      const delay = options.delay ?? START_DELAY_SECONDS;
      this.loopStartTime = context.currentTime + delay - this.pausedAt;
      this.noteIndex = findFirstNoteAtOrAfter(
        this.song.notes,
        this.pausedAt
      );
      this.isPlaying = true;
      this.schedule();
      this.schedulerId = window.setInterval(
        () => this.schedule(),
        SCHEDULE_INTERVAL_MS
      );
    }

    pause(options = {}) {
      if (this.isPlaying && this.context !== null) {
        const elapsed = this.context.currentTime - this.loopStartTime;
        this.pausedAt =
          elapsed > 0 ? elapsed % this.song.duration : 0;
      }

      if (this.schedulerId !== null) {
        window.clearInterval(this.schedulerId);
        this.schedulerId = null;
      }

      this.isPlaying = false;
      this.silenceActiveNotes();

      for (const node of this.effectNodes) {
        node.disconnect();
      }

      this.effectNodes = [];
      this.masterGain = null;
      this.periodicWave = null;
      if (options.reset === true) {
        this.pausedAt = 0;
        this.noteIndex = 0;
      }
    }

    stop() {
      this.pause({ reset: true });
    }

    schedule() {
      if (
        !this.isPlaying ||
        this.context === null ||
        this.masterGain === null
      ) {
        return;
      }

      const now = this.context.currentTime;
      const duration = this.song.duration;

      if (this.loopStartTime + duration <= now) {
        const completedLoops = Math.floor(
          (now - this.loopStartTime) / duration
        );
        this.loopStartTime += completedLoops * duration;
        this.noteIndex = findFirstNoteAtOrAfter(
          this.song.notes,
          now - this.loopStartTime
        );
      }

      const horizon = now + SCHEDULE_AHEAD_SECONDS;

      for (let loopGuard = 0; loopGuard < 2; loopGuard += 1) {
        while (this.noteIndex < this.song.notes.length) {
          const note = this.song.notes[this.noteIndex];
          const scheduledTime = this.loopStartTime + note.time;

          if (scheduledTime >= horizon) {
            return;
          }

          if (scheduledTime >= now + 0.005) {
            this.scheduleNote(note, scheduledTime);
          }

          this.noteIndex += 1;
        }

        if (this.loopStartTime + duration >= horizon) {
          return;
        }

        this.loopStartTime += duration;
        this.noteIndex = 0;
      }
    }

    scheduleNote(note, startTime) {
      const context = this.context;
      if (
        context === null ||
        this.masterGain === null ||
        this.periodicWave === null
      ) {
        return;
      }

      const carrier = context.createOscillator();
      const shimmer = context.createOscillator();
      const shimmerGain = context.createGain();
      const envelope = context.createGain();
      const panner =
        typeof context.createStereoPanner === "function"
          ? context.createStereoPanner()
          : null;
      const noteDuration = Math.max(
        0.14,
        Math.min(note.duration * 1.2 + 0.05, 1.9)
      );
      const attackEnd = startTime + 0.012;
      const bodyEnd = Math.min(
        startTime + 0.19,
        startTime + noteDuration * 0.72
      );
      const stopTime = startTime + noteDuration;
      const peak = 0.024 + note.velocity * 0.03;
      const baseFrequency = 440 * 2 ** ((note.midi - 69) / 12);

      carrier.setPeriodicWave(this.periodicWave);
      carrier.frequency.setValueAtTime(baseFrequency, startTime);
      shimmer.type = "sine";
      shimmer.frequency.setValueAtTime(baseFrequency * 2.008, startTime);
      shimmerGain.gain.setValueAtTime(0.2, startTime);

      envelope.gain.setValueAtTime(MIN_GAIN, startTime);
      envelope.gain.exponentialRampToValueAtTime(peak, attackEnd);
      envelope.gain.exponentialRampToValueAtTime(
        Math.max(MIN_GAIN, peak * 0.48),
        bodyEnd
      );
      envelope.gain.exponentialRampToValueAtTime(MIN_GAIN, stopTime);

      carrier.connect(envelope);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(envelope);

      if (panner !== null) {
        const pan = Math.max(-0.34, Math.min(0.34, (note.midi - 60) / 48));
        panner.pan.setValueAtTime(pan, startTime);
        envelope.connect(panner);
        panner.connect(this.masterGain);
      } else {
        envelope.connect(this.masterGain);
      }

      const oscillators = [carrier, shimmer];
      let oscillatorsRemaining = oscillators.length;

      for (const oscillator of oscillators) {
        oscillator.addEventListener(
          "ended",
          () => {
            this.activeOscillators.delete(oscillator);
            oscillator.disconnect();
            oscillatorsRemaining -= 1;

            if (oscillatorsRemaining === 0) {
              shimmerGain.disconnect();
              envelope.disconnect();
              panner?.disconnect();
            }
          },
          { once: true }
        );

        this.activeOscillators.add(oscillator);
        oscillator.start(startTime);
        oscillator.stop(stopTime + 0.02);
      }
    }

    silenceActiveNotes() {
      if (this.context === null) {
        this.activeOscillators.clear();
        return;
      }

      for (const oscillator of this.activeOscillators) {
        try {
          oscillator.stop(this.context.currentTime);
        } catch {
          // 이미 종료된 노드는 ended 이벤트에서 정리된다.
        }
      }
      this.activeOscillators.clear();
    }
  }

  window.MidiBgmPlayer = MidiBgmPlayer;
})();
