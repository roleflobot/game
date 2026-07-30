const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
let nextTimerId = 1;
const activeTimers = new Set();

global.window = {
  atob,
  setInterval() {
    const id = nextTimerId;
    nextTimerId += 1;
    activeTimers.add(id);
    return id;
  },
  clearInterval(id) {
    activeTimers.delete(id);
  },
};

eval(
  fs.readFileSync(
    path.join(
      projectRoot,
      "assets",
      "bach-english-suite-no2-prelude-bwv807-data.js"
    ),
    "utf8"
  )
);
eval(fs.readFileSync(path.join(projectRoot, "bgm.js"), "utf8"));

const sourceMidi = fs.readFileSync(
  path.join(
    projectRoot,
    "assets",
    "bach-english-suite-no2-prelude-bwv807.mid"
  )
);
const embeddedMidi = Buffer.from(window.BACH_BGM_MIDI.base64, "base64");
assert.deepEqual(embeddedMidi, sourceMidi, "Embedded MIDI must match its source.");
assert.equal(sourceMidi.subarray(0, 4).toString("ascii"), "MThd");

class FakeAudioParam {
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeAudioNode {
  constructor() {
    this.gain = new FakeAudioParam();
    this.frequency = new FakeAudioParam();
    this.Q = new FakeAudioParam();
    this.delayTime = new FakeAudioParam();
    this.pan = new FakeAudioParam();
    this.disconnected = false;
  }

  connect() {}

  disconnect() {
    this.disconnected = true;
  }
}

class FakeOscillator extends FakeAudioNode {
  setPeriodicWave() {}
  addEventListener() {}
  start() {}
  stop() {}
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = "running";
    this.destination = new FakeAudioNode();
    this.oscillatorCount = 0;
    this.filterCount = 0;
    this.delayCount = 0;
    this.pannerCount = 0;
  }

  createGain() {
    return new FakeAudioNode();
  }

  createPeriodicWave() {
    return {};
  }

  createBiquadFilter() {
    this.filterCount += 1;
    return new FakeAudioNode();
  }

  createDelay() {
    this.delayCount += 1;
    return new FakeAudioNode();
  }

  createStereoPanner() {
    this.pannerCount += 1;
    return new FakeAudioNode();
  }

  createOscillator() {
    this.oscillatorCount += 1;
    return new FakeOscillator();
  }
}

const player = new window.MidiBgmPlayer(window.BACH_BGM_MIDI.base64);
assert.equal(player.info.noteCount, 3075);
assert.ok(player.info.duration > 301 && player.info.duration < 302);

const context = new FakeAudioContext();
player.start(context, { restart: true, delay: 0.1 });
assert.equal(player.isPlaying, true);
assert.equal(activeTimers.size, 1);
context.currentTime = 0.1;
player.schedule();
assert.ok(
  context.oscillatorCount >= 2 && context.oscillatorCount % 2 === 0,
  "Each scheduled note must create carrier and shimmer oscillators."
);
assert.equal(context.filterCount, 1);
assert.equal(context.delayCount, 1);
assert.ok(context.pannerCount > 0);

context.currentTime = 0.25;
player.schedule();
player.pause();
assert.equal(player.isPlaying, false);
assert.equal(activeTimers.size, 0);
assert.ok(player.pausedAt > 0.14 && player.pausedAt < 0.16);

player.start(context);
assert.equal(player.isPlaying, true);
assert.equal(activeTimers.size, 1);
player.stop();
assert.equal(player.isPlaying, false);
assert.equal(player.pausedAt, 0);
assert.equal(activeTimers.size, 0);

console.log(
  `BGM OK: ${player.info.noteCount} notes, ${player.info.duration.toFixed(
    2
  )} seconds, offline MIDI copy verified.`
);
