let gameState = "ready"; // "ready" | "playing" | "gameOver"

const startScreen = document.getElementById("start-screen");
const gameScreen = document.getElementById("game-screen");
const gameOverScreen = document.getElementById("game-over-screen");
const startButton = document.getElementById("start-button");
const restartButton = document.getElementById("restart-button");
const scoreDisplay = document.getElementById("score-display");
const livesDisplay = document.getElementById("lives-display");
const finalScoreDisplay = document.getElementById("final-score");
const finalPlayerNameDisplay = document.getElementById("final-player-name");
const playArea = document.getElementById("play-area");
const soundToggleButton = document.getElementById("sound-toggle");
const powerupSpreadEl = document.getElementById("powerup-spread");
const powerupRapidEl = document.getElementById("powerup-rapid");
const powerupShieldEl = document.getElementById("powerup-shield");
const startPlayerNameInput = document.getElementById("start-player-name");
const restartPlayerNameInput = document.getElementById("restart-player-name");
const startNameError = document.getElementById("start-name-error");
const restartNameError = document.getElementById("restart-name-error");
const currentRankDisplay = document.getElementById("current-rank");
const leaderboardList = document.getElementById("leaderboard-list");

const PLAY_WIDTH = 480;
const PLAY_HEIGHT = 640;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 26;

const BULLET_WIDTH = 4;
const BULLET_HEIGHT = 14;
const BULLET_SPEED = 480; // px per second

const ENEMY_BASE_SPEED = 100; // px per second
const ENEMY_MAX_SPEED = 300; // px per second, 난이도 상한
const ENEMY_SPEED_GROWTH = 5; // 초당 속도 증가량

const ENEMY_SPAWN_INTERVAL = 1.2; // seconds
const ENEMY_MIN_SPAWN_INTERVAL = 0.4; // 난이도 하한 (가장 빠른 스폰 간격)
const ENEMY_SPAWN_INTERVAL_DECAY = 0.01; // 초당 스폰 간격 감소량

const ENEMY_DRIFT_AMPLITUDE = 60; // px, 스카웃 좌우 드리프트 폭
const ENEMY_DRIFT_FREQUENCY = 2.5; // rad/s, 드리프트 속도
const AMBUSH_WARNING_DURATION = 0.2; // 스카웃/크루저 역공 예고 시간
const AMBUSH_WARNING_WIDTH = 48;

const ENEMY_TIERS = {
  drone: { width: 32, height: 32, speedMultiplier: 1, hp: 1, drift: false, className: "enemy--drone", weight: 6, ambushChance: 1, warnsBeforeAmbush: false },
  scout: { width: 30, height: 30, speedMultiplier: 1.4, hp: 1, drift: true, className: "enemy--scout", weight: 3, ambushChance: 0.2, warnsBeforeAmbush: true },
  cruiser: { width: 44, height: 44, speedMultiplier: 0.7, hp: 2, drift: false, className: "enemy--cruiser", weight: 1, ambushChance: 0.4, warnsBeforeAmbush: true },
};

const SHIP_MARKUP = {
  player: `
    <svg class="ship-svg" viewBox="0 0 100 70" aria-hidden="true">
      <path class="player-engine-glow" d="M35 53 L43 66 L35 78 Z M65 53 L57 66 L65 78 Z"/>
      <path class="player-hull" d="M50 2 L3 63 L32 51 L39 67 L50 56 L61 67 L68 51 L97 63 Z"/>
      <path class="player-wing player-wing--left" d="M47 14 L11 57 L35 47 L42 58 Z"/>
      <path class="player-wing player-wing--right" d="M53 14 L89 57 L65 47 L58 58 Z"/>
      <path class="player-spine" d="M50 7 L41 48 L50 57 L59 48 Z"/>
      <path class="player-cockpit" d="M50 13 C43 21 43 31 50 38 C57 31 57 21 50 13 Z"/>
      <path class="player-panel-line" d="M22 51 L43 40 M78 51 L57 40 M50 40 L50 54"/>
      <circle class="player-engine-port" cx="37" cy="57" r="3"/>
      <circle class="player-engine-port" cx="63" cy="57" r="3"/>
    </svg>`,
  drone: `
    <svg class="ship-svg" viewBox="0 0 100 100" aria-hidden="true">
      <g class="drone-frame">
        <path class="drone-hull" d="M50 3 L97 50 L50 97 L3 50 Z"/>
        <path class="drone-cutout" d="M50 15 L85 50 L50 85 L15 50 Z"/>
        <path class="drone-arm" d="M50 5 L56 37 L95 50 L56 56 L50 95 L44 56 L5 50 L44 44 Z"/>
      </g>
      <circle class="drone-core-ring" cx="50" cy="50" r="17"/>
      <circle class="drone-core" cx="50" cy="50" r="8"/>
      <path class="drone-sight" d="M50 27 V38 M73 50 H62 M50 73 V62 M27 50 H38"/>
    </svg>`,
  scout: `
    <svg class="ship-svg" viewBox="0 0 100 100" aria-hidden="true">
      <path class="scout-hull" d="M50 98 L4 8 L36 22 L50 3 L64 22 L96 8 Z"/>
      <path class="scout-wing scout-wing--left" d="M46 81 L12 17 L38 31 Z"/>
      <path class="scout-wing scout-wing--right" d="M54 81 L88 17 L62 31 Z"/>
      <path class="scout-spine" d="M50 12 L39 39 L50 87 L61 39 Z"/>
      <path class="scout-panel-line" d="M22 27 L42 40 M78 27 L58 40 M50 43 V75"/>
      <circle class="scout-sensor-ring" cx="50" cy="37" r="10"/>
      <circle class="scout-sensor" cx="50" cy="37" r="4"/>
    </svg>`,
  cruiser: `
    <svg class="ship-svg" viewBox="0 0 100 100" aria-hidden="true">
      <path class="cruiser-hull" d="M24 4 H76 L98 50 L76 96 H24 L2 50 Z"/>
      <path class="cruiser-plate cruiser-plate--top" d="M29 11 H71 L82 34 L63 30 L50 18 L37 30 L18 34 Z"/>
      <path class="cruiser-plate cruiser-plate--left" d="M10 48 L30 30 L41 40 L34 73 L20 85 Z"/>
      <path class="cruiser-plate cruiser-plate--right" d="M90 48 L70 30 L59 40 L66 73 L80 85 Z"/>
      <path class="cruiser-keel" d="M50 20 L62 43 L58 79 L50 91 L42 79 L38 43 Z"/>
      <circle class="cruiser-core-ring" cx="50" cy="52" r="18"/>
      <circle class="cruiser-core" cx="50" cy="52" r="9"/>
      <path class="cruiser-panel-line" d="M20 50 H34 M80 50 H66 M50 24 V35 M50 69 V84"/>
      <circle class="cruiser-port" cx="22" cy="50" r="4"/>
      <circle class="cruiser-port" cx="78" cy="50" r="4"/>
    </svg>`,
};

const STARTING_LIVES = 3;
const KILL_SCORE = 50; // 적 1마리 제거당 점수
const MAX_PLAYER_NAME_LENGTH = 12;
const LEADERBOARD_DISPLAY_LIMIT = 10;
const LEADERBOARD_STORAGE_LIMIT = 50;
const LEADERBOARD_STORAGE_KEY = "ready-to-destroy-leaderboard-v1";

const ITEM_SIZE = 22;
const ITEM_DROP_CHANCE = 0.15; // 적 처치 시 아이템 드롭 확률
const ITEM_FALL_SPEED = 70; // px per second, 아이템 낙하 속도

const POWERUP_DURATION = 8; // seconds, 파워업 1개당 지급되는 지속시간
const RAPID_MAX_DURATION = 16; // seconds, 속사 지속시간 상한 (2개분)
const BASE_FIRE_COOLDOWN = 0.1; // seconds, 기본 발사 쿨다운
const RAPID_FIRE_COOLDOWN = 0.05; // seconds, 속사 중 발사 쿨다운 (절반)

const MAX_SHIELD_CHARGES = 3; // 실드 최대 중첩 개수

const SPREAD_MAX_LEVEL = 2; // 1: 3방향, 2: 6방향 (상한)
const SPREAD_VX_BY_LEVEL = {
  1: [-140, 0, 140],
  2: [-260, -140, -50, 50, 140, 260],
};

const ITEM_TYPES = {
  spread: { className: "item--spread", symbolId: "item-icon-spread" },
  shield: { className: "item--shield", symbolId: "item-icon-shield" },
  rapid: { className: "item--rapid", symbolId: "item-icon-rapid" },
};

// 아이콘 실물은 index.html 상단 스프라이트의 <symbol>에 있고 여기서는 참조만 한다.
function itemIconMarkup(typeKey) {
  return (
    '<svg class="item-svg" viewBox="0 0 100 100" aria-hidden="true">' +
    '<use href="#' + ITEM_TYPES[typeKey].symbolId + '"/></svg>'
  );
}

let player = null;
let bullets = [];
let bulletCanvas = null;
let bulletContext = null;
let enemies = [];
let items = [];
let enemySpawnTimer = 0;
let lives = STARTING_LIVES;
let enemiesDestroyed = 0;
let currentPlayerName = "";
let leaderboardEntries = loadLeaderboard();
let elapsedTime = 0; // 난이도 상승 기준 경과 시간
let fireCooldownRemaining = 0;
let shieldCharges = 0;
let activePowerups = {
  spread: { active: false, timeRemaining: 0, level: 0 },
  rapid: { active: false, timeRemaining: 0 },
};
let animationFrameId = null;
let lastTimestamp = null;
const keys = new Set();

const PLAYER_SPEED = 320; // px per second

const MOVE_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "A", "d", "D", "w", "W", "s", "S"];

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioContext = null;
let soundEnabled = true;

function ensureAudioContext() {
  if (!soundEnabled || !AudioContextClass) return null;

  if (audioContext === null) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    audioContext.resume().catch(() => {});
  }

  return audioContext;
}

function playTone(frequency, endFrequency, duration, type, volume, delay = 0) {
  const context = ensureAudioContext();
  if (context === null) return;

  const startTime = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, endFrequency),
    startTime + duration
  );

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + Math.min(0.008, duration / 3));
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.02);
}

function playShootSound() {
  playTone(760, 320, 0.045, "triangle", 0.025);
}

function playExplosionSound(tierKey) {
  const startFrequency = tierKey === "cruiser" ? 130 : tierKey === "scout" ? 190 : 160;
  playTone(startFrequency, 42, 0.18, "sawtooth", 0.045);
}

function playPlayerHitSound() {
  playTone(120, 58, 0.2, "square", 0.045);
}

function playShieldSound() {
  playTone(520, 900, 0.12, "sine", 0.035);
  playTone(900, 1320, 0.1, "sine", 0.025, 0.05);
}

function playItemSound(type) {
  const baseFrequency = type === "spread" ? 440 : type === "shield" ? 520 : 660;
  playTone(baseFrequency, baseFrequency * 1.25, 0.1, "sine", 0.03);
  playTone(baseFrequency * 1.5, baseFrequency * 2, 0.12, "triangle", 0.025, 0.07);
}

function playStartSound() {
  playTone(260, 320, 0.1, "sine", 0.03);
  playTone(390, 460, 0.1, "sine", 0.03, 0.08);
  playTone(520, 650, 0.14, "triangle", 0.035, 0.16);
}

function playGameOverSound() {
  playTone(330, 260, 0.18, "triangle", 0.04);
  playTone(220, 170, 0.2, "triangle", 0.04, 0.14);
  playTone(110, 55, 0.35, "sawtooth", 0.035, 0.29);
}

function updateSoundToggle() {
  soundToggleButton.textContent = soundEnabled ? "SOUND: ON" : "SOUND: OFF";
  soundToggleButton.setAttribute("aria-pressed", String(!soundEnabled));
  soundToggleButton.setAttribute(
    "aria-label",
    soundEnabled ? "효과음 끄기" : "효과음 켜기"
  );
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  updateSoundToggle();
  if (soundEnabled) {
    ensureAudioContext();
    playTone(440, 660, 0.1, "sine", 0.025);
  }
}

function compareLeaderboardEntries(left, right) {
  if (right.score !== left.score) {
    return right.score - left.score;
  }
  if (left.achievedAt !== right.achievedAt) {
    return left.achievedAt - right.achievedAt;
  }
  return left.id.localeCompare(right.id);
}

function loadLeaderboard() {
  try {
    const saved = JSON.parse(localStorage.getItem(LEADERBOARD_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];

    return saved
      .filter(
        (entry) =>
          entry &&
          typeof entry.name === "string" &&
          entry.name.trim() !== "" &&
          Number.isFinite(entry.score)
      )
      .map((entry, index) => ({
        id:
          typeof entry.id === "string"
            ? entry.id
            : "saved-" + index + "-" + String(entry.achievedAt || 0),
        name: Array.from(entry.name.trim())
          .slice(0, MAX_PLAYER_NAME_LENGTH)
          .join(""),
        score: Math.max(0, Math.floor(entry.score)),
        achievedAt: Number.isFinite(entry.achievedAt) ? entry.achievedAt : 0,
      }))
      .sort(compareLeaderboardEntries)
      .slice(0, LEADERBOARD_STORAGE_LIMIT);
  } catch {
    return [];
  }
}

function saveLeaderboard() {
  try {
    localStorage.setItem(
      LEADERBOARD_STORAGE_KEY,
      JSON.stringify(leaderboardEntries)
    );
  } catch {
    // file:// 환경 등에서 저장소가 막혀도 현재 탭의 순위표는 계속 동작한다.
  }
}

function recordScore(playerName, score) {
  const entry = {
    id: String(Date.now()) + "-" + Math.random().toString(36).slice(2),
    name: playerName,
    score,
    achievedAt: Date.now(),
  };
  const rankedEntries = [...leaderboardEntries, entry].sort(
    compareLeaderboardEntries
  );
  const rank = rankedEntries.findIndex((candidate) => candidate.id === entry.id) + 1;

  leaderboardEntries = rankedEntries.slice(0, LEADERBOARD_STORAGE_LIMIT);
  saveLeaderboard();
  return { entry, rank };
}

function renderLeaderboard(result) {
  leaderboardList.innerHTML = "";
  leaderboardEntries
    .slice(0, LEADERBOARD_DISPLAY_LIMIT)
    .forEach((entry, index) => {
      const row = document.createElement("li");
      row.className =
        "leaderboard-row" + (entry.id === result.entry.id ? " is-current" : "");
      if (entry.id === result.entry.id) {
        row.setAttribute("aria-current", "true");
      }

      const rank = document.createElement("span");
      rank.className = "leaderboard-rank";
      rank.textContent = String(index + 1).padStart(2, "0");

      const name = document.createElement("span");
      name.className = "leaderboard-name";
      name.textContent = entry.name;

      const score = document.createElement("span");
      score.className = "leaderboard-score";
      score.textContent = String(entry.score).padStart(6, "0");

      row.append(rank, name, score);
      leaderboardList.appendChild(row);
    });

  currentRankDisplay.textContent =
    result.entry.name +
    " // RANK " +
    result.rank +
    " // " +
    String(result.entry.score).padStart(6, "0");
}

function clearNameError(input, errorDisplay) {
  input.removeAttribute("aria-invalid");
  errorDisplay.textContent = "";
}

function getNameControlsForCurrentScreen() {
  if (gameState === "ready") {
    return { input: startPlayerNameInput, errorDisplay: startNameError };
  }
  if (gameState === "gameOver") {
    return { input: restartPlayerNameInput, errorDisplay: restartNameError };
  }
  return null;
}

function readPlayerName(controls) {
  const playerName = controls.input.value.trim();
  const characterCount = Array.from(playerName).length;

  if (characterCount === 0) {
    controls.input.setAttribute("aria-invalid", "true");
    controls.errorDisplay.textContent = "이름을 입력해야 출격할 수 있습니다.";
    controls.input.focus();
    return null;
  }

  if (characterCount > MAX_PLAYER_NAME_LENGTH) {
    controls.input.setAttribute("aria-invalid", "true");
    controls.errorDisplay.textContent =
      "이름은 " + MAX_PLAYER_NAME_LENGTH + "자까지 입력할 수 있습니다.";
    controls.input.focus();
    return null;
  }

  clearNameError(controls.input, controls.errorDisplay);
  return playerName;
}

window.addEventListener("keydown", (event) => {
  const isPlayerNameInput =
    event.target instanceof HTMLInputElement &&
    event.target.classList.contains("player-name-input");

  if (isPlayerNameInput) {
    if (
      event.key === "Enter" &&
      !event.repeat &&
      !event.isComposing &&
      (gameState === "ready" || gameState === "gameOver")
    ) {
      event.preventDefault();
      handleStartOrRestart();
    }
    return;
  }

  if (MOVE_KEYS.includes(event.key)) {
    event.preventDefault();
  }
  keys.add(event.key);

  if (event.key === " " && !event.repeat && gameState === "playing") {
    attemptFire();
  }

  if (
    (event.key === "Enter" || event.key === "r" || event.key === "R") &&
    !event.repeat &&
    (gameState === "ready" || gameState === "gameOver")
  ) {
    handleStartOrRestart();
  }

  if ((event.key === "m" || event.key === "M") && !event.repeat) {
    toggleSound();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key);
});

function showScreen(screen) {
  startScreen.classList.add("hidden");
  gameScreen.classList.add("hidden");
  gameOverScreen.classList.add("hidden");
  screen.classList.remove("hidden");
}

const SHIELD_AURA_SIZE = 56; // 플레이어를 감싸는 방어막 링 지름

function createPlayer() {
  playArea.innerHTML = "";

  bulletCanvas = document.createElement("canvas");
  bulletCanvas.className = "bullet-canvas";
  bulletCanvas.width = PLAY_WIDTH;
  bulletCanvas.height = PLAY_HEIGHT;
  bulletCanvas.setAttribute("aria-hidden", "true");
  bulletContext = bulletCanvas.getContext("2d", {
    alpha: true,
    desynchronized: true,
  });
  playArea.appendChild(bulletCanvas);

  const el = document.createElement("div");
  el.className = "player";
  el.innerHTML = SHIP_MARKUP.player;
  el.addEventListener("animationend", (event) => {
    if (event.target === el && event.animationName === "player-hit-flash") {
      el.classList.remove("hit-flash");
    }
  });
  playArea.appendChild(el);

  const shieldEl = document.createElement("div");
  shieldEl.className = "shield-aura hidden";
  playArea.appendChild(shieldEl);

  player = {
    el,
    shieldEl,
    x: PLAY_WIDTH / 2 - PLAYER_WIDTH / 2,
    y: PLAY_HEIGHT - PLAYER_HEIGHT - 16,
    bank: 0,
  };
  renderPlayer();
}

function triggerPlayerHitFlash() {
  player.el.classList.remove("hit-flash");
  void player.el.offsetWidth; // 리플로우를 강제해 애니메이션을 재시작
  player.el.classList.add("hit-flash");
}

playArea.addEventListener("animationend", (event) => {
  if (event.target === playArea) {
    playArea.classList.remove("shake");
  }
});

function triggerScreenShake() {
  playArea.classList.remove("shake");
  void playArea.offsetWidth;
  playArea.classList.add("shake");
}

/*
 * 이펙트는 요소 하나하나가 별도 합성 레이어로 올라간다. 난전에서 레이어가 200개
 * 가까이 쌓이면 GPU가 버티지 못하고 화면이 잠깐 하얘지므로, 파편 수를 줄이고
 * 동시 개수에 상한을 둔다. 격추 피드백이 더 중요하니 폭발 쪽 상한을 더 넉넉히 준다.
 */
const MAX_EXPLOSIONS = 10;
const MAX_IMPACT_SPARKS = 8;

let activeExplosions = 0;
let activeImpactSparks = 0;

function spawnExplosion(centerX, centerY, size, tierKey) {
  if (activeExplosions >= MAX_EXPLOSIONS) return;
  activeExplosions += 1;

  const el = document.createElement("div");
  el.className = "explosion explosion--" + tierKey;
  const explosionSize = size * 1.6;
  el.style.width = explosionSize + "px";
  el.style.height = explosionSize + "px";
  el.style.left = centerX - explosionSize / 2 + "px";
  el.style.top = centerY - explosionSize / 2 + "px";
  // 파편도 개별 요소로 두면 폭발 1개당 레이어가 6개씩 생긴다. 방사형 스포크를
  // conic-gradient로 한 요소에 그려서 폭발당 요소를 2개로 줄인다.
  const rays = document.createElement("span");
  rays.className = "explosion-rays";
  el.appendChild(rays);

  el.addEventListener("animationend", (event) => {
    if (event.target === el && event.animationName === "explosion-lifecycle") {
      activeExplosions -= 1;
      el.remove();
    }
  });
  playArea.appendChild(el);
}

function spawnImpactSpark(centerX, centerY, tierKey) {
  if (activeImpactSparks >= MAX_IMPACT_SPARKS) return;
  activeImpactSparks += 1;

  // 광선 6개를 자식 요소로 두던 걸 단일 섬광으로 합쳤다(피탄은 가장 자주 발생한다).
  const el = document.createElement("div");
  el.className = "impact-spark impact-spark--" + tierKey;
  el.style.left = centerX + "px";
  el.style.top = centerY + "px";
  el.addEventListener("animationend", (event) => {
    if (event.target === el && event.animationName === "impact-burst") {
      activeImpactSparks -= 1;
      el.remove();
    }
  });
  playArea.appendChild(el);
}

/*
 * CSS 필터/그라디언트/애니메이션은 종류별 첫 사용 때 GPU 렌더링 경로가 준비된다.
 * 전투 중 여러 효과가 동시에 처음 등장하면 최종 합성 버퍼가 한 프레임 비는 환경이
 * 있으므로, 시작 화면에서 대표 요소를 실제로 몇 프레임 그린 뒤 제거한다.
 *
 * 한 프레임에 전부 만들면 워밍업 자체가 큰 부하가 되므로 종류별 배치로 나눈다.
 * display:none, opacity:0, 화면 밖 배치는 브라우저가 페인트를 생략할 수 있어 쓰지 않는다.
 */
function prewarmGpuEffects() {
  const container = document.createElement("div");
  container.className = "gpu-prewarm";
  container.setAttribute("aria-hidden", "true");
  document.body.appendChild(container);

  const appendElement = (className, markup = "") => {
    const el = document.createElement("div");
    el.className = className;
    el.innerHTML = markup;
    container.appendChild(el);
    return el;
  };

  const batches = [
    () => {
      appendElement("gpu-prewarm-screen-shake");
      appendElement("player hit-flash", SHIP_MARKUP.player);
      appendElement("enemy enemy--drone", SHIP_MARKUP.drone);
      appendElement("enemy enemy--scout", SHIP_MARKUP.scout);
      appendElement("enemy enemy--cruiser damaged", SHIP_MARKUP.cruiser);
    },
    () => {
      appendElement("shield-aura");
      Object.keys(ITEM_TYPES).forEach((typeKey) => {
        appendElement("item " + ITEM_TYPES[typeKey].className, itemIconMarkup(typeKey));
      });
    },
    () => {
      ["drone", "scout", "cruiser"].forEach((tierKey) => {
        appendElement("impact-spark impact-spark--" + tierKey);
      });
      appendElement("ambush-warning ambush-warning--scout");
      appendElement("ambush-warning ambush-warning--cruiser");
    },
    () => {
      ["drone", "scout", "cruiser"].forEach((tierKey) => {
        const explosion = appendElement("explosion explosion--" + tierKey);
        explosion.style.width = "52px";
        explosion.style.height = "52px";
        const rays = document.createElement("span");
        rays.className = "explosion-rays";
        explosion.appendChild(rays);
      });
    },
  ];

  let batchIndex = 0;
  const renderNextBatch = () => {
    batches[batchIndex]();
    batchIndex += 1;

    // 스타일 계산을 요청해 이 배치가 다음 페인트에서 생략되지 않게 한다.
    void container.offsetWidth;

    if (batchIndex < batches.length) {
      requestAnimationFrame(renderNextBatch);
      return;
    }

    // 가장 긴 일회성 효과(340ms)가 한 번 완주한 뒤 워밍업 요소를 정리한다.
    setTimeout(() => container.remove(), 400);
  };

  requestAnimationFrame(renderNextBatch);
}

function spawnAmbushWarning(centerX, tierKey) {
  const el = document.createElement("div");
  el.className = "ambush-warning ambush-warning--" + tierKey;
  el.style.left =
    Math.max(
      0,
      Math.min(PLAY_WIDTH - AMBUSH_WARNING_WIDTH, centerX - AMBUSH_WARNING_WIDTH / 2)
    ) + "px";
  el.addEventListener("animationend", () => el.remove());
  playArea.appendChild(el);
  return el;
}

function renderPlayer() {
  player.el.style.left = player.x + "px";
  player.el.style.top = player.y + "px";
  player.el.style.transform = "rotate(" + player.bank + "deg)";

  const centerX = player.x + PLAYER_WIDTH / 2;
  const centerY = player.y + PLAYER_HEIGHT / 2;
  player.shieldEl.style.left = centerX - SHIELD_AURA_SIZE / 2 + "px";
  player.shieldEl.style.top = centerY - SHIELD_AURA_SIZE / 2 + "px";
  player.shieldEl.classList.toggle("hidden", shieldCharges === 0);
}

function updateLivesDisplay() {
  livesDisplay.innerHTML = "";
  for (let index = 0; index < STARTING_LIVES; index += 1) {
    const pip = document.createElement("span");
    pip.className = "life-pip" + (index < lives ? " is-active" : "");
    pip.textContent = "◆";
    livesDisplay.appendChild(pip);
  }
  livesDisplay.setAttribute("aria-label", "남은 목숨 " + lives);
}

function getScore() {
  return enemiesDestroyed * KILL_SCORE;
}

function updateScoreDisplay() {
  scoreDisplay.textContent = String(getScore()).padStart(6, "0");
}

function fireBullet(vx) {
  bullets.push({
    x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
    y: player.y - BULLET_HEIGHT,
    vx: vx || 0,
  });
}

function attemptFire() {
  if (fireCooldownRemaining > 0) return;

  fireCooldownRemaining = activePowerups.rapid.active ? RAPID_FIRE_COOLDOWN : BASE_FIRE_COOLDOWN;

  if (activePowerups.spread.active) {
    const vxList = SPREAD_VX_BY_LEVEL[activePowerups.spread.level] || SPREAD_VX_BY_LEVEL[1];
    vxList.forEach((vx) => fireBullet(vx));
  } else {
    fireBullet(0);
  }

  playShootSound();
}

function renderBullets() {
  if (bulletContext === null) return;

  bulletContext.clearRect(0, 0, PLAY_WIDTH, PLAY_HEIGHT);

  // 총알별 DOM 대신 잔상·외곽광·코어를 각각 한 번의 캔버스 배치로 그린다.
  bulletContext.lineCap = "round";
  bulletContext.strokeStyle = "rgba(255, 179, 0, 0.2)";
  bulletContext.lineWidth = 8;
  bulletContext.beginPath();
  bullets.forEach((bullet) => {
    const centerX = Math.round(bullet.x) + BULLET_WIDTH / 2;
    const topY = Math.round(bullet.y);
    bulletContext.moveTo(centerX, topY + 28);
    bulletContext.lineTo(centerX, topY + 7);
  });
  bulletContext.stroke();

  bulletContext.strokeStyle = "rgba(255, 225, 76, 0.78)";
  bulletContext.lineWidth = 5;
  bulletContext.beginPath();
  bullets.forEach((bullet) => {
    const centerX = Math.round(bullet.x) + BULLET_WIDTH / 2;
    const topY = Math.round(bullet.y);
    bulletContext.moveTo(centerX, topY + BULLET_HEIGHT);
    bulletContext.lineTo(centerX, topY + 2);
  });
  bulletContext.stroke();

  bulletContext.strokeStyle = "#fffbe0";
  bulletContext.lineWidth = 2;
  bulletContext.beginPath();
  bullets.forEach((bullet) => {
    const centerX = Math.round(bullet.x) + BULLET_WIDTH / 2;
    const topY = Math.round(bullet.y);
    bulletContext.moveTo(centerX, topY + BULLET_HEIGHT - 3);
    bulletContext.lineTo(centerX, topY + 2);
  });
  bulletContext.stroke();
}

function pickEnemyTierKey() {
  const totalWeight = Object.values(ENEMY_TIERS).reduce((sum, tier) => sum + tier.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const key of Object.keys(ENEMY_TIERS)) {
    const tier = ENEMY_TIERS[key];
    if (roll < tier.weight) return key;
    roll -= tier.weight;
  }
  return "drone";
}

function spawnEnemy() {
  const tierKey = pickEnemyTierKey();
  const tier = ENEMY_TIERS[tierKey];

  const el = document.createElement("div");
  el.className = "enemy " + tier.className;
  el.innerHTML = SHIP_MARKUP[tierKey];
  playArea.appendChild(el);

  const x = Math.random() * (PLAY_WIDTH - tier.width);
  enemies.push({
    el,
    tier: tierKey,
    width: tier.width,
    height: tier.height,
    hp: tier.hp,
    x,
    baseX: x,
    y: -tier.height,
    driftTime: 0,
    direction: 1, // 1: 하강, 0: 역공 예고 대기, -1: 역방향 상승
    ambushed: false,
    ambushWarningRemaining: 0,
    ambushWarningEl: null,
  });
}

function renderEnemies() {
  enemies.forEach((enemy) => {
    enemy.el.style.left = enemy.x + "px";
    enemy.el.style.top = enemy.y + "px";
  });
}

function maybeDropItem(centerX, centerY) {
  if (Math.random() >= ITEM_DROP_CHANCE) return;

  const typeKeys = Object.keys(ITEM_TYPES);
  const typeKey = typeKeys[Math.floor(Math.random() * typeKeys.length)];
  const type = ITEM_TYPES[typeKey];

  const el = document.createElement("div");
  el.className = "item " + type.className;
  el.innerHTML = itemIconMarkup(typeKey);
  playArea.appendChild(el);

  items.push({
    el,
    type: typeKey,
    x: centerX - ITEM_SIZE / 2,
    y: centerY - ITEM_SIZE / 2,
  });
}

function applyPowerup(type) {
  playItemSound(type);

  if (type === "shield") {
    shieldCharges = Math.min(shieldCharges + 1, MAX_SHIELD_CHARGES);
    return;
  }

  if (type === "rapid") {
    activePowerups.rapid.active = true;
    activePowerups.rapid.timeRemaining = Math.min(
      activePowerups.rapid.timeRemaining + POWERUP_DURATION,
      RAPID_MAX_DURATION
    );
    return;
  }

  if (type === "spread") {
    const wasActive = activePowerups.spread.active;
    activePowerups.spread.active = true;
    activePowerups.spread.timeRemaining = POWERUP_DURATION;
    activePowerups.spread.level = wasActive
      ? Math.min(activePowerups.spread.level + 1, SPREAD_MAX_LEVEL)
      : 1;
  }
}

function renderItems() {
  items.forEach((item) => {
    item.el.style.left = item.x + "px";
    item.el.style.top = item.y + "px";
  });
}

function updatePowerupHud() {
  powerupSpreadEl.classList.toggle("hidden", !activePowerups.spread.active);
  powerupRapidEl.classList.toggle("hidden", !activePowerups.rapid.active);
  powerupShieldEl.classList.toggle("hidden", shieldCharges === 0);

  if (activePowerups.spread.active) {
    powerupSpreadEl.querySelector(".powerup-bar-fill").style.width =
      (activePowerups.spread.timeRemaining / POWERUP_DURATION) * 100 + "%";
    powerupSpreadEl.querySelector(".powerup-name").textContent =
      activePowerups.spread.level >= SPREAD_MAX_LEVEL ? "TRIDENT ×6" : "TRIDENT ×3";
    powerupSpreadEl.querySelector(".powerup-time").textContent =
      Math.ceil(activePowerups.spread.timeRemaining) + "s";
  }
  if (activePowerups.rapid.active) {
    powerupRapidEl.querySelector(".powerup-bar-fill").style.width =
      (activePowerups.rapid.timeRemaining / RAPID_MAX_DURATION) * 100 + "%";
    powerupRapidEl.querySelector(".powerup-time").textContent =
      Math.ceil(activePowerups.rapid.timeRemaining) + "s";
  }
  if (shieldCharges > 0) {
    powerupShieldEl.querySelector(".powerup-count").textContent = "×" + shieldCharges;
  }
}

const MAX_DELTA_TIME = 1 / 30; // 프레임이 밀려도 한 번에 너무 많이 이동하지 않도록 상한

function getDeltaTime(timestamp) {
  if (lastTimestamp === null) {
    lastTimestamp = timestamp;
  }
  const rawDeltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  return Math.min(rawDeltaTime, MAX_DELTA_TIME);
}

function update(deltaTime) {
  const moveLeft = keys.has("ArrowLeft") || keys.has("a") || keys.has("A");
  const moveRight = keys.has("ArrowRight") || keys.has("d") || keys.has("D");
  const moveUp = keys.has("ArrowUp") || keys.has("w") || keys.has("W");
  const moveDown = keys.has("ArrowDown") || keys.has("s") || keys.has("S");

  let dx = (moveRight ? 1 : 0) - (moveLeft ? 1 : 0);
  let dy = (moveDown ? 1 : 0) - (moveUp ? 1 : 0);

  if (dx !== 0 && dy !== 0) {
    const norm = Math.SQRT1_2; // 1 / sqrt(2), keeps diagonal speed equal to axis speed
    dx *= norm;
    dy *= norm;
  }

  player.x += dx * PLAYER_SPEED * deltaTime;
  player.y += dy * PLAYER_SPEED * deltaTime;
  const targetBank = dx * 7;
  player.bank += (targetBank - player.bank) * Math.min(1, deltaTime * 12);

  player.x = Math.max(0, Math.min(PLAY_WIDTH - PLAYER_WIDTH, player.x));
  player.y = Math.max(0, Math.min(PLAY_HEIGHT - PLAYER_HEIGHT, player.y));

  elapsedTime += deltaTime;

  fireCooldownRemaining = Math.max(0, fireCooldownRemaining - deltaTime);

  // 속사 중에는 Space를 누르고 있는 동안 쿨다운마다 자동으로 발사한다.
  if (activePowerups.rapid.active && keys.has(" ")) {
    attemptFire();
  }

  ["spread", "rapid"].forEach((key) => {
    const powerup = activePowerups[key];
    if (powerup.active) {
      powerup.timeRemaining -= deltaTime;
      if (powerup.timeRemaining <= 0) {
        powerup.active = false;
        powerup.timeRemaining = 0;
        if (key === "spread") {
          powerup.level = 0;
        }
      }
    }
  });

  bullets.forEach((bullet) => {
    bullet.y -= BULLET_SPEED * deltaTime;
    bullet.x += bullet.vx * deltaTime;
  });

  bullets = bullets.filter((bullet) => {
    const offScreen =
      bullet.y + BULLET_HEIGHT < 0 ||
      bullet.x + BULLET_WIDTH < 0 ||
      bullet.x > PLAY_WIDTH;
    return !offScreen;
  });

  items.forEach((item) => {
    item.y += ITEM_FALL_SPEED * deltaTime;
  });

  items = items.filter((item) => {
    const offScreen = item.y > PLAY_HEIGHT;
    if (offScreen) {
      item.el.remove();
    }
    return !offScreen;
  });

  const currentSpawnInterval = Math.max(
    ENEMY_MIN_SPAWN_INTERVAL,
    ENEMY_SPAWN_INTERVAL - ENEMY_SPAWN_INTERVAL_DECAY * elapsedTime
  );

  enemySpawnTimer += deltaTime;
  if (enemySpawnTimer >= currentSpawnInterval) {
    enemySpawnTimer -= currentSpawnInterval;
    spawnEnemy();
  }

  const currentEnemySpeed = Math.min(
    ENEMY_MAX_SPEED,
    ENEMY_BASE_SPEED + ENEMY_SPEED_GROWTH * elapsedTime
  );

  enemies.forEach((enemy) => {
    const tier = ENEMY_TIERS[enemy.tier];

    if (enemy.direction === 0) {
      enemy.ambushWarningRemaining -= deltaTime;
      if (enemy.ambushWarningRemaining <= 0) {
        enemy.ambushWarningRemaining = 0;
        if (enemy.ambushWarningEl) {
          enemy.ambushWarningEl.remove();
          enemy.ambushWarningEl = null;
        }
        enemy.direction = -1;
        enemy.el.classList.add("is-reversing");
      }
      return;
    }

    enemy.y += currentEnemySpeed * tier.speedMultiplier * enemy.direction * deltaTime;

    if (tier.drift && enemy.direction !== 0) {
      enemy.driftTime += deltaTime;
      const driftX = Math.sin(enemy.driftTime * ENEMY_DRIFT_FREQUENCY) * ENEMY_DRIFT_AMPLITUDE;
      enemy.x = Math.max(0, Math.min(PLAY_WIDTH - enemy.width, enemy.baseX + driftX));
    }
  });

  enemies = enemies.filter((enemy) => {
    const tier = ENEMY_TIERS[enemy.tier];

    // 하단 통과 시 티어별 확률로 위치를 바꿔 1회만 역공한다.
    if (enemy.direction === 1 && !enemy.ambushed && enemy.y > PLAY_HEIGHT) {
      if (Math.random() < tier.ambushChance) {
        enemy.x = Math.random() * (PLAY_WIDTH - enemy.width);
        enemy.baseX = enemy.x;
        enemy.y = PLAY_HEIGHT;
        enemy.ambushed = true;

        if (tier.warnsBeforeAmbush) {
          enemy.direction = 0;
          enemy.ambushWarningRemaining = AMBUSH_WARNING_DURATION;
          enemy.ambushWarningEl = spawnAmbushWarning(
            enemy.x + enemy.width / 2,
            enemy.tier
          );
        } else {
          enemy.direction = -1;
          enemy.el.classList.add("is-reversing");
        }
        return true;
      }
    }

    const offScreenBottom = enemy.direction === 1 && enemy.y > PLAY_HEIGHT;
    const offScreenTop = enemy.direction === -1 && enemy.y + enemy.height < 0;

    if (offScreenBottom || offScreenTop) {
      if (enemy.ambushWarningEl) {
        enemy.ambushWarningEl.remove();
      }
      enemy.el.remove();
      return false;
    }
    return true;
  });
}

function rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function checkCollisions() {
  const hitBullets = new Set();
  const destroyedEnemies = new Set();
  const hitsTaken = new Map(); // enemy -> 이번 프레임에 맞은 횟수

  bullets.forEach((bullet) => {
    enemies.forEach((enemy) => {
      if (hitBullets.has(bullet) || destroyedEnemies.has(enemy)) return;
      if (
        rectsOverlap(
          bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT,
          enemy.x, enemy.y, enemy.width, enemy.height
        )
      ) {
        hitBullets.add(bullet);
        const hits = (hitsTaken.get(enemy) || 0) + 1;
        hitsTaken.set(enemy, hits);
        if (enemy.hp - hits <= 0) {
          destroyedEnemies.add(enemy);
        }
      }
    });
  });

  if (hitBullets.size > 0) {
    bullets = bullets.filter((bullet) => {
      if (hitBullets.has(bullet)) {
        return false;
      }
      return true;
    });
  }

  hitsTaken.forEach((hits, enemy) => {
    if (!destroyedEnemies.has(enemy)) {
      spawnImpactSpark(
        enemy.x + enemy.width / 2,
        enemy.y + enemy.height / 2,
        enemy.tier
      );
      enemy.hp -= hits;
      if (enemy.tier === "cruiser" && enemy.hp === 1) {
        enemy.el.classList.add("damaged");
      }
    }
  });

  if (destroyedEnemies.size > 0) {
    enemies = enemies.filter((enemy) => {
      if (destroyedEnemies.has(enemy)) {
        const centerX = enemy.x + enemy.width / 2;
        const centerY = enemy.y + enemy.height / 2;
        spawnExplosion(centerX, centerY, Math.max(enemy.width, enemy.height), enemy.tier);
        playExplosionSound(enemy.tier);
        maybeDropItem(centerX, centerY);
        enemy.el.remove();
        return false;
      }
      return true;
    });
    enemiesDestroyed += destroyedEnemies.size;
  }

  const collidedWithPlayer = new Set();
  enemies.forEach((enemy) => {
    if (
      rectsOverlap(
        player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT,
        enemy.x, enemy.y, enemy.width, enemy.height
      )
    ) {
      collidedWithPlayer.add(enemy);
    }
  });

  if (collidedWithPlayer.size > 0) {
    enemies = enemies.filter((enemy) => {
      if (collidedWithPlayer.has(enemy)) {
        spawnExplosion(
          enemy.x + enemy.width / 2,
          enemy.y + enemy.height / 2,
          Math.max(enemy.width, enemy.height),
          enemy.tier
        );
        enemy.el.remove();
        return false;
      }
      return true;
    });

    let unabsorbedHits = collidedWithPlayer.size;
    if (shieldCharges > 0) {
      const absorbed = Math.min(shieldCharges, unabsorbedHits);
      shieldCharges -= absorbed;
      unabsorbedHits -= absorbed;
      if (absorbed > 0) {
        playShieldSound();
      }
    }

    if (unabsorbedHits > 0) {
      lives = Math.max(0, lives - unabsorbedHits);
      updateLivesDisplay();
      triggerPlayerHitFlash();
      triggerScreenShake();
      playPlayerHitSound();
    }
  }

  const collectedItems = new Set();
  items.forEach((item) => {
    if (
      rectsOverlap(
        player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT,
        item.x, item.y, ITEM_SIZE, ITEM_SIZE
      )
    ) {
      collectedItems.add(item);
    }
  });

  if (collectedItems.size > 0) {
    items = items.filter((item) => {
      if (collectedItems.has(item)) {
        applyPowerup(item.type);
        item.el.remove();
        return false;
      }
      return true;
    });
  }
}

function render() {
  renderPlayer();
  renderBullets();
  renderEnemies();
  renderItems();
  updateScoreDisplay();
  updatePowerupHud();
}

function gameLoop(timestamp) {
  if (gameState !== "playing") return;

  const deltaTime = getDeltaTime(timestamp);

  update(deltaTime);
  checkCollisions();

  if (lives <= 0) {
    endGame();
    return;
  }

  render();

  animationFrameId = requestAnimationFrame(gameLoop);
}

function stopLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  lastTimestamp = null;
}

function endGame() {
  if (gameState !== "playing") return;

  gameState = "gameOver";
  stopLoop();
  playGameOverSound();
  const finalScore = getScore();
  const rankingResult = recordScore(currentPlayerName, finalScore);
  finalScoreDisplay.textContent = String(finalScore).padStart(6, "0");
  finalPlayerNameDisplay.textContent = currentPlayerName;
  renderLeaderboard(rankingResult);
  restartPlayerNameInput.value = "";
  clearNameError(restartPlayerNameInput, restartNameError);
  showScreen(gameOverScreen);
  requestAnimationFrame(() => restartPlayerNameInput.focus());
}

function startGame() {
  stopLoop();
  gameState = "playing";
  enemiesDestroyed = 0;
  elapsedTime = 0;
  updateScoreDisplay();
  lives = STARTING_LIVES;
  updateLivesDisplay();
  keys.clear();
  bullets = [];
  enemies = [];
  items = [];
  enemySpawnTimer = 0;
  fireCooldownRemaining = 0;
  // createPlayer()가 playArea를 비우면 animationend가 오지 않아 카운터가 새므로 함께 리셋한다.
  activeExplosions = 0;
  activeImpactSparks = 0;
  shieldCharges = 0;
  activePowerups = {
    spread: { active: false, timeRemaining: 0, level: 0 },
    rapid: { active: false, timeRemaining: 0 },
  };
  updatePowerupHud();
  playArea.classList.remove("shake");
  createPlayer();
  showScreen(gameScreen);
  animationFrameId = requestAnimationFrame(gameLoop);
}

let isRestarting = false;

const RESTART_GUARD_MS = 300; // 더블클릭 등 중복 입력을 무시할 시간창

function handleStartOrRestart() {
  if (isRestarting) return;

  const nameControls = getNameControlsForCurrentScreen();
  if (nameControls === null) return;

  const playerName = readPlayerName(nameControls);
  if (playerName === null) return;

  isRestarting = true;
  currentPlayerName = playerName;
  nameControls.input.value = "";

  ensureAudioContext();
  startGame();
  playStartSound();

  setTimeout(() => {
    isRestarting = false;
  }, RESTART_GUARD_MS);
}

startButton.addEventListener("click", handleStartOrRestart);
restartButton.addEventListener("click", handleStartOrRestart);
soundToggleButton.addEventListener("click", toggleSound);
startPlayerNameInput.addEventListener("input", () => {
  clearNameError(startPlayerNameInput, startNameError);
});
restartPlayerNameInput.addEventListener("input", () => {
  clearNameError(restartPlayerNameInput, restartNameError);
});
updateSoundToggle();
prewarmGpuEffects();
