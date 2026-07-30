let gameState = "ready"; // "ready" | "playing" | "dying" | "gameOver"
let isPaused = false;
let isInvincible = false; // 스크린샷용 치트: I키로 토글, 맞아도 목숨이 줄지 않음

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
const powerupSpreadEl = document.getElementById("powerup-spread");
const powerupRapidEl = document.getElementById("powerup-rapid");
const powerupShieldEl = document.getElementById("powerup-shield");
const startPlayerNameInput = document.getElementById("start-player-name");
const restartPlayerNameInput = document.getElementById("restart-player-name");
const startNameError = document.getElementById("start-name-error");
const restartNameError = document.getElementById("restart-name-error");
const currentRankDisplay = document.getElementById("current-rank");
const leaderboardList = document.getElementById("leaderboard-list");
const bossWarningEl = document.getElementById("boss-warning");
const bossWarningSubtitleEl = bossWarningEl.querySelector(".boss-warning-subtitle");
const pauseButton = document.getElementById("pause-button");
const pauseOverlayEl = document.getElementById("pause-overlay");
const stageDisplayEl = document.getElementById("stage-display");

const PLAY_WIDTH = 480;
const PLAY_HEIGHT = 670;
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 26;
const PLAYER_DEATH_DELAY_MS = 1000;
const PLAYER_DEATH_EXPLOSION_SIZE = 72;

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
  drone: { width: 32, height: 32, speedMultiplier: 1, hp: 1, itemDropChance: 0.12, drift: false, className: "enemy--drone", weight: 6, ambushChance: 1, warnsBeforeAmbush: false },
  scout: { width: 30, height: 30, speedMultiplier: 1.4, hp: 1, itemDropChance: 0.12, drift: true, className: "enemy--scout", weight: 3, ambushChance: 0.2, warnsBeforeAmbush: true },
  cruiser: { width: 44, height: 44, speedMultiplier: 0.7, hp: 4, itemDropChance: 0.24, drift: false, className: "enemy--cruiser", weight: 1, ambushChance: 0.4, warnsBeforeAmbush: true },
};

// 스테이지 보스: 거대 크루저 + 잡몹 소환 + 화염탄. 처치 수 기준으로 등장한다.
const BOSS_KILL_INTERVAL = 50; // 몇 킬마다 보스가 등장하는지
const BOSS_WARNING_DURATION = 2.5; // 등장 전 경고 배너 지속시간(초)
const BOSS_BASE_HP = 200;
const BOSS_HP_GROWTH = 20; // 두 번째 등장부터 회차마다 각 보스 hp 증가량
const BOSS_COUNT_GROWTH_INTERVAL = 2; // 두 회차마다 동시 등장 보스 +1
const BOSS_WIDTH = 132;
const BOSS_HEIGHT = 132;
const BOSS_SEPARATION_GAP = 8;
const BOSS_SETTLE_Y = 90; // 진입 후 정착하는 y좌표
// 일반 전술 보스와 직접 돌격형의 복귀 지점이 화면 2/3 아래로 내려가지 않게 하는 상한.
// 직접 돌격형은 공격 중에만 이 선을 넘고, 공격이 끝나면 즉시 상단 대형으로 돌아온다.
const BOSS_MAX_Y = (PLAY_HEIGHT * 2) / 3 - BOSS_HEIGHT;
const BOSS_ENTER_SPEED = 90; // px/s, 진입 속도
const BOSS_DRIFT_AMPLITUDE = 130;
const BOSS_DRIFT_FREQUENCY = 0.55;
const BOSS_SUMMON_INTERVAL = 4.5; // 잡몹 소환 주기(초)
const BOSS_SUMMON_MIN = 2;
const BOSS_SUMMON_MAX = 4;
const BOSS_DASH_INTERVAL = 6; // 돌진 시도 주기(초)
const BOSS_DASH_WARNING_DURATION = 0.6;
const BOSS_DASH_SPEED = 420; // px/s, 돌진 중 이동 속도
const BOSS_DASH_DURATION = 0.9; // 돌진 상태 유지 시간(초)
const BOSS_DIRECT_ASSAULT_SPEED = 520; // px/s, 플레이어의 X·Y 위치로 직접 돌격
const BOSS_DIRECT_RETREAT_SPEED = 620; // px/s, 공격 직후 상단 대형으로 복귀
const BOSS_DIRECT_ASSAULT_MAX_DURATION = 1.2;
const BOSS_PLAYER_HIT_COOLDOWN = 1; // 보스와 접촉 후 재피격까지 무적 시간(초)
const BOSS_ITEM_DROP_DAMAGE_INTERVAL = 20;
const BOSS_ITEM_DROP_CHANCE = 0.24;
const BOSS_DEFEAT_SCORE_BONUS = 1000;
const BOSS_DEFEAT_EXPLOSION_SIZE = 160;

// 보스 원거리 무기: 화염탄 8방향 발사. 총알로 파괴할 수 없고 몸으로 피해야 한다.
const BOSS_FIRE_INTERVAL = 5 / 3; // 화염탄 발사 빈도 3배(기존 5초 간격)
const BOSS_FIREBALL_COUNT = 8;
const BOSS_FIREBALL_SPEED = 480; // px/s, 기존 속도의 3배
const BOSS_FIREBALL_SIZE = 26; // px, 지름

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
const ITEM_FALL_SPEED = 70; // px per second, 아이템 낙하 속도
const ITEM_PITY_SOFT_START_KILLS = 10;
const ITEM_PITY_BONUS_PER_KILL = 0.02;
const ITEM_PITY_HARD_KILLS = 20;
const ITEM_PITY_HARD_SECONDS = 60;

const TRIDENT_CHARGES_PER_ITEM = 60;
const TRIDENT_MAX_CHARGES = 120;
const BOLT_CHARGES_PER_ITEM = 80;
const BOLT_MAX_CHARGES = 160;
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
let bosses = [];
let bossFireballs = [];
let bossEncountersCompleted = 0;
let bossEncounterMaxHp = 0;
let bossEncounterTotalBosses = 0;
let bossWarningRemaining = 0;
let killsTowardNextBoss = 0;
let bonusScore = 0;
let currentPlayerName = "";
let leaderboardEntries = loadLeaderboard();
let elapsedTime = 0; // 난이도 상승 기준 경과 시간
let killsSinceItemPickup = 0;
let lastItemPickupElapsedTime = 0;
let fireCooldownRemaining = 0;
let shieldCharges = 0;
let activePowerups = {
  spread: { charges: 0, level: 0 },
  rapid: { charges: 0 },
};
let animationFrameId = null;
let gameOverTimerId = null;
let lastTimestamp = null;
const keys = new Set();

const PLAYER_SPEED = 320; // px per second

const MOVE_KEYS = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " ", "a", "A", "d", "D", "w", "W", "s", "S"];

const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const SFX_VOLUME_MULTIPLIER = 1.3;
let audioContext = null;
const backgroundMusic =
  window.MidiBgmPlayer && window.BACH_BGM_MIDI
    ? new window.MidiBgmPlayer(window.BACH_BGM_MIDI.base64, {
        volume: 0.32448,
      })
    : null;

function ensureAudioContext() {
  if (!AudioContextClass) return null;

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
  const adjustedVolume = Math.min(1, volume * SFX_VOLUME_MULTIPLIER);
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(
    Math.max(1, endFrequency),
    startTime + duration
  );

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(
    adjustedVolume,
    startTime + Math.min(0.008, duration / 3)
  );
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

function playPlayerDestructionSound() {
  playTone(210, 38, 0.6, "sawtooth", 0.075);
  playTone(105, 25, 0.75, "square", 0.045, 0.08);
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

  if (event.key === " " && !event.repeat && gameState === "playing" && !isPaused) {
    attemptFire(isEnhanceKeyHeld());
  }

  if (
    (event.key === "Enter" || event.key === "r" || event.key === "R") &&
    !event.repeat &&
    (gameState === "ready" || gameState === "gameOver")
  ) {
    handleStartOrRestart();
  }

  // 스크린샷용 숨김 치트: I키로 무적 모드 토글 (제출용 조작법에는 넣지 않음)
  if ((event.key === "i" || event.key === "I") && !event.repeat && gameState === "playing") {
    isInvincible = !isInvincible;
    console.log("[cheat] invincible:", isInvincible);
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
  // 보스 경고 배너와 일시정지 오버레이는 index.html에서 play-area의 자식으로
  // 미리 만들어져 있는데, 위 innerHTML 초기화가 이것도 함께 지운다.
  // 같은 노드를 다시 붙여 재사용한다.
  playArea.appendChild(bossWarningEl);
  playArea.appendChild(pauseOverlayEl);

  bulletCanvas = document.createElement("canvas");
  bulletCanvas.className = "bullet-canvas";
  bulletCanvas.width = PLAY_WIDTH;
  bulletCanvas.height = PLAY_HEIGHT;
  bulletCanvas.setAttribute("aria-hidden", "true");
  // desynchronized: true는 저지연 입력용 옵션인데, 일부 Windows/GPU 조합에서
  // 캔버스가 투명해야 할 때 불투명한 검정으로 합성되는 버그를 유발한다.
  // 이 캔버스는 play-area 전체를 덮고 있어서 그 버그가 나면 별 배경 전체가
  // 가려져 보인다. 저지연 이득보다 이 리스크가 커서 뺀다.
  bulletContext = bulletCanvas.getContext("2d", {
    alpha: true,
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

function spawnExplosion(centerX, centerY, size, tierKey, force = false) {
  if (!force && activeExplosions >= MAX_EXPLOSIONS) return;
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

function spawnPlayerDestruction() {
  const centerX = player.x + PLAYER_WIDTH / 2;
  const centerY = player.y + PLAYER_HEIGHT / 2;

  player.shieldEl.classList.add("hidden");
  player.el.remove();
  spawnExplosion(
    centerX,
    centerY,
    PLAYER_DEATH_EXPLOSION_SIZE,
    "player",
    true
  );
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

function triggerBossHitFlash(boss) {
  boss.el.classList.remove("boss--hit");
  void boss.el.offsetWidth;
  boss.el.classList.add("boss--hit");
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
      appendElement("enemy enemy--cruiser boss boss--hit", SHIP_MARKUP.cruiser);
    },
    () => {
      appendElement("shield-aura");
      Object.keys(ITEM_TYPES).forEach((typeKey) => {
        appendElement("item " + ITEM_TYPES[typeKey].className, itemIconMarkup(typeKey));
      });
    },
    () => {
      ["drone", "scout", "cruiser", "boss"].forEach((tierKey) => {
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
  return enemiesDestroyed * KILL_SCORE + bonusScore;
}

function updateScoreDisplay() {
  scoreDisplay.textContent = String(getScore()).padStart(6, "0");
}

function updateStageDisplay() {
  stageDisplayEl.textContent = "STAGE " + (bossEncountersCompleted + 1);
}

// 공격강화 모듈 발동 키. WASD·화살표 유저 모두 편하게 누르도록 X(왼손)와
// M(오른손) 둘 다 지원한다. SHIFT는 연타 시 Windows 고정키(스티키 키) 팝업을
// 띄우는 문제가 있어 더 이상 쓰지 않는다.
function isEnhanceKeyHeld() {
  return keys.has("x") || keys.has("X") || keys.has("m") || keys.has("M");
}

function fireBullet(vx) {
  bullets.push({
    x: player.x + PLAYER_WIDTH / 2 - BULLET_WIDTH / 2,
    y: player.y - BULLET_HEIGHT,
    vx: vx || 0,
  });
}

function attemptFire(enhanced) {
  if (fireCooldownRemaining > 0) return;

  const usesRapid = enhanced && activePowerups.rapid.charges > 0;
  const usesSpread =
    enhanced &&
    activePowerups.spread.charges > 0 &&
    activePowerups.spread.level > 0;

  fireCooldownRemaining = usesRapid ? RAPID_FIRE_COOLDOWN : BASE_FIRE_COOLDOWN;

  if (usesSpread) {
    const vxList = SPREAD_VX_BY_LEVEL[activePowerups.spread.level] || SPREAD_VX_BY_LEVEL[1];
    vxList.forEach((vx) => fireBullet(vx));
  } else {
    fireBullet(0);
  }

  // 한 번의 발사 명령(3·6방향 포함)을 1회로 계산한다. 실제 발사가 성공한
  // 시점에만 장착된 모듈의 충전을 차감하므로 쿨다운 입력은 낭비되지 않는다.
  if (usesSpread) {
    activePowerups.spread.charges -= 1;
    if (activePowerups.spread.charges <= 0) {
      activePowerups.spread.charges = 0;
      activePowerups.spread.level = 0;
    }
  }

  if (usesRapid) {
    activePowerups.rapid.charges -= 1;
    if (activePowerups.rapid.charges <= 0) {
      activePowerups.rapid.charges = 0;
    }
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

function updateBossPhaseVisual(boss) {
  const ratio = boss.hp / boss.maxHp;
  boss.el.classList.toggle("boss--phase2", ratio <= 0.66);
  boss.el.classList.toggle("boss--phase3", ratio <= 0.33);
}

function startBossWarning() {
  const nextEncounterNumber = bossEncountersCompleted + 1;
  const incomingBossCount = getBossCountForEncounter(nextEncounterNumber);
  bossWarningRemaining = BOSS_WARNING_DURATION;
  bossWarningSubtitleEl.textContent =
    incomingBossCount === 1
      ? "HOSTILE CRUISER INBOUND"
      : "HOSTILE CRUISERS ×" + incomingBossCount + " INBOUND";
  bossWarningEl.classList.remove("hidden");
}

function getBossCountForEncounter(encounterNumber) {
  return Math.floor(encounterNumber / BOSS_COUNT_GROWTH_INTERVAL) + 1;
}

function getBossHpForEncounter(encounterNumber) {
  return BOSS_BASE_HP + (encounterNumber - 1) * BOSS_HP_GROWTH;
}

// 동시에 등장하는 보스를 최대 3열로 나누고 상단 2/3 안에서 행을 균등 배치한다.
function createBossFormation(count) {
  const maxColumns = 3;
  const rowCount = Math.ceil(count / maxColumns);
  const minimumPerRow = Math.floor(count / rowCount);
  const rowsWithExtraBoss = count % rowCount;
  const topY = rowCount === 1 ? BOSS_SETTLE_Y : 24;
  const rowStep = rowCount > 1 ? (BOSS_MAX_Y - topY) / (rowCount - 1) : 0;
  const horizontalGap = 16;
  const formation = [];

  for (let row = 0; row < rowCount; row += 1) {
    const bossesInRow = minimumPerRow + (row < rowsWithExtraBoss ? 1 : 0);
    const rowWidth =
      bossesInRow * BOSS_WIDTH + Math.max(0, bossesInRow - 1) * horizontalGap;
    const startX = (PLAY_WIDTH - rowWidth) / 2;
    const rowDriftAmplitude = Math.max(
      0,
      Math.min(BOSS_DRIFT_AMPLITUDE, startX, PLAY_WIDTH - startX - rowWidth)
    );

    for (let column = 0; column < bossesInRow; column += 1) {
      formation.push({
        x: startX + column * (BOSS_WIDTH + horizontalGap),
        y: Math.min(BOSS_MAX_Y, topY + row * rowStep),
        driftAmplitude: rowDriftAmplitude,
      });
    }
  }

  return formation;
}

// 크루저 SVG를 재사용해 해당 회차에 필요한 수만큼 동시에 배치한다.
function spawnBossEncounter() {
  const encounterNumber = bossEncountersCompleted + 1;
  const count = getBossCountForEncounter(encounterNumber);
  const hp = getBossHpForEncounter(encounterNumber);
  const formation = createBossFormation(count);

  bossEncounterMaxHp = hp * count;
  bossEncounterTotalBosses = count;
  bosses = formation.map((position, index) => {
    // 홀수 인덱스를 직접 돌격형으로 지정하면 전체의 floor(1/2)가 대형 전체에 분산된다.
    const usesDirectAssault = index % 2 === 1;
    const el = document.createElement("div");
    el.className = "enemy enemy--cruiser boss";
    el.classList.toggle("boss--direct-assaulter", usesDirectAssault);
    el.innerHTML = SHIP_MARKUP.cruiser;
    el.addEventListener("animationend", (event) => {
      if (event.animationName === "boss-hit-flash") {
        el.classList.remove("boss--hit");
      }
    });
    playArea.appendChild(el);

    return {
      el,
      spawnOrder: index,
      usesDirectAssault,
      width: BOSS_WIDTH,
      height: BOSS_HEIGHT,
      hp,
      maxHp: hp,
      damageTowardItemDrop: 0,
      x: position.x,
      y: -BOSS_HEIGHT,
      targetY: position.y,
      baseX: position.x,
      driftAmplitude: position.driftAmplitude,
      driftTime: 0,
      phase: "entering", // entering | active | dash-warning | dashing | retreating
      summonTimer: BOSS_SUMMON_INTERVAL + index * 0.6,
      dashTimer: BOSS_DASH_INTERVAL + index * 0.8,
      dashWarningRemaining: 0,
      dashProgress: 0,
      dashTargetX: position.x,
      dashTargetY: position.y,
      dashOriginX: position.x,
      dashOriginY: position.y,
      fireTimer: (BOSS_FIRE_INTERVAL / count) * (index + 1),
      playerHitCooldown: 0,
    };
  });
}

// 잡몹은 일반 spawnEnemy()를 그대로 재사용한다 — 처치 확률·움직임·아이템 드롭까지
// 보통 적과 완전히 동일하게 취급되어야 하므로 별도 로직을 두지 않는다.
function summonBossMinions() {
  const count =
    BOSS_SUMMON_MIN + Math.floor(Math.random() * (BOSS_SUMMON_MAX - BOSS_SUMMON_MIN + 1));
  for (let index = 0; index < count; index += 1) {
    spawnEnemy();
  }
}

// 화염탄은 총알(bullets 배열)과 완전히 분리된 별도 개체다. checkCollisions()의
// 총알-보스 판정 대상이 아니라서 총알로 파괴할 수 없고, 몸으로 피해야 한다.
function spawnBossFireball(owner, centerX, centerY, vx, vy) {
  const el = document.createElement("div");
  el.className = "boss-fireball";
  playArea.appendChild(el);
  bossFireballs.push({
    el,
    owner,
    x: centerX - BOSS_FIREBALL_SIZE / 2,
    y: centerY - BOSS_FIREBALL_SIZE / 2,
    vx,
    vy,
  });
}

function fireBossFireballs(boss) {
  const centerX = boss.x + boss.width / 2;
  const centerY = boss.y + boss.height / 2;
  for (let index = 0; index < BOSS_FIREBALL_COUNT; index += 1) {
    const angle = (index / BOSS_FIREBALL_COUNT) * Math.PI * 2;
    spawnBossFireball(
      boss,
      centerX,
      centerY,
      Math.cos(angle) * BOSS_FIREBALL_SPEED,
      Math.sin(angle) * BOSS_FIREBALL_SPEED
    );
  }
  playExplosionSound("cruiser");
}

function renderBossFireballs() {
  bossFireballs.forEach((fireball) => {
    fireball.el.style.left = fireball.x + "px";
    fireball.el.style.top = fireball.y + "px";
  });
}

function moveBossTowardPoint(boss, targetX, targetY, speed, deltaTime) {
  const dx = targetX - boss.x;
  const dy = targetY - boss.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) return true;

  const step = speed * deltaTime;
  if (step >= distance) {
    boss.x = targetX;
    boss.y = targetY;
    return true;
  }

  boss.x += (dx / distance) * step;
  boss.y += (dy / distance) * step;
  return false;
}

function updateSingleBoss(boss, deltaTime) {
  boss.playerHitCooldown = Math.max(0, boss.playerHitCooldown - deltaTime);

  if (boss.phase === "entering") {
    boss.y += BOSS_ENTER_SPEED * deltaTime;
    if (boss.y >= boss.targetY) {
      boss.y = Math.min(boss.targetY, BOSS_MAX_Y);
      boss.phase = "active";
    }
    return;
  }

  if (boss.phase === "dash-warning") {
    boss.dashWarningRemaining -= deltaTime;
    if (boss.dashWarningRemaining <= 0) {
      boss.phase = "dashing";
      boss.dashProgress = 0;
      boss.dashOriginX = boss.x;
      boss.dashOriginY = boss.y;
      boss.dashTargetX = Math.max(
        0,
        Math.min(PLAY_WIDTH - boss.width, player.x + PLAYER_WIDTH / 2 - boss.width / 2)
      );
      boss.dashTargetY = boss.usesDirectAssault
        ? Math.max(
            0,
            Math.min(
              PLAY_HEIGHT - boss.height,
              player.y + PLAYER_HEIGHT / 2 - boss.height / 2
            )
          )
        : boss.y;
      boss.el.classList.remove("boss--dash-warning");
      boss.el.classList.toggle("boss--direct-charging", boss.usesDirectAssault);
    }
    return;
  }

  if (boss.phase === "dashing") {
    boss.dashProgress += deltaTime;

    if (boss.usesDirectAssault) {
      const reachedPlayer = moveBossTowardPoint(
        boss,
        boss.dashTargetX,
        boss.dashTargetY,
        BOSS_DIRECT_ASSAULT_SPEED,
        deltaTime
      );

      if (
        reachedPlayer ||
        boss.dashProgress >= BOSS_DIRECT_ASSAULT_MAX_DURATION
      ) {
        boss.phase = "retreating";
      }
      return;
    }

    const dx = boss.dashTargetX - boss.x;
    const step = BOSS_DASH_SPEED * deltaTime;
    boss.x += Math.sign(dx) * Math.min(Math.abs(dx), step);

    if (boss.dashProgress >= BOSS_DASH_DURATION) {
      boss.phase = "active";
      boss.baseX = boss.x;
      boss.dashTimer = BOSS_DASH_INTERVAL;
    }
    return;
  }

  if (boss.phase === "retreating") {
    const returnedToFormation = moveBossTowardPoint(
      boss,
      boss.dashOriginX,
      Math.min(boss.dashOriginY, BOSS_MAX_Y),
      BOSS_DIRECT_RETREAT_SPEED,
      deltaTime
    );

    if (returnedToFormation) {
      boss.phase = "active";
      boss.baseX = boss.x;
      boss.dashTimer = BOSS_DASH_INTERVAL;
      boss.el.classList.remove("boss--direct-charging");
    }
    return;
  }

  // active: 좌우로 천천히 드리프트하면서 잡몹 소환과 돌진 시도 타이머를 흘려보낸다.
  boss.driftTime += deltaTime;
  boss.x = Math.max(
    0,
    Math.min(
      PLAY_WIDTH - boss.width,
      boss.baseX +
        Math.sin(boss.driftTime * BOSS_DRIFT_FREQUENCY) * boss.driftAmplitude
    )
  );

  boss.summonTimer -= deltaTime;
  if (boss.summonTimer <= 0) {
    boss.summonTimer = BOSS_SUMMON_INTERVAL;
    summonBossMinions();
  }

  boss.dashTimer -= deltaTime;
  if (boss.dashTimer <= 0) {
    boss.phase = "dash-warning";
    boss.dashWarningRemaining = BOSS_DASH_WARNING_DURATION;
    boss.el.classList.add("boss--dash-warning");
  }

  boss.fireTimer -= deltaTime;
  if (boss.fireTimer <= 0) {
    boss.fireTimer = BOSS_FIRE_INTERVAL;
    fireBossFireballs(boss);
  }
}

function moveBossHorizontally(boss, distance) {
  const previousX = boss.x;
  boss.x = Math.max(0, Math.min(PLAY_WIDTH - boss.width, boss.x + distance));
  const actualDistance = boss.x - previousX;
  boss.baseX = Math.max(
    0,
    Math.min(PLAY_WIDTH - boss.width, boss.baseX + actualDistance)
  );
}

// 대형과 드리프트가 허용하는 범위에서는 보스 사이에 간격을 확보한다. 화면 폭이나
// 보스 수 때문에 전부 분리할 수 없는 경우에는 가능한 만큼만 밀고 겹침을 허용한다.
function separateOverlappingBosses() {
  for (let pass = 0; pass < 2; pass += 1) {
    for (let leftIndex = 0; leftIndex < bosses.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < bosses.length; rightIndex += 1) {
        const firstBoss = bosses[leftIndex];
        const secondBoss = bosses[rightIndex];
        const enteringDifferentRows =
          (firstBoss.phase === "entering" || secondBoss.phase === "entering") &&
          Math.abs(firstBoss.targetY - secondBoss.targetY) > 0.01;
        const directAssaultPassingThrough =
          (
            firstBoss.usesDirectAssault &&
            (firstBoss.phase === "dashing" || firstBoss.phase === "retreating")
          ) ||
          (
            secondBoss.usesDirectAssault &&
            (secondBoss.phase === "dashing" || secondBoss.phase === "retreating")
          );

        // 서로 다른 행으로 진입 중인 보스는 곧 세로로 갈라지므로 대형의 x좌표를 보존한다.
        // 직접 돌격형도 다른 보스 사이를 통과할 수 있어야 하므로 분리 힘을 적용하지 않는다.
        if (enteringDifferentRows || directAssaultPassingThrough) continue;

        const verticalOverlap =
          firstBoss.y < secondBoss.y + secondBoss.height &&
          firstBoss.y + firstBoss.height > secondBoss.y;

        if (!verticalOverlap) continue;

        const firstIsLeft =
          firstBoss.x + firstBoss.width / 2 < secondBoss.x + secondBoss.width / 2 ||
          (
            firstBoss.x + firstBoss.width / 2 ===
              secondBoss.x + secondBoss.width / 2 &&
            firstBoss.spawnOrder < secondBoss.spawnOrder
          );
        const leftBoss = firstIsLeft ? firstBoss : secondBoss;
        const rightBoss = firstIsLeft ? secondBoss : firstBoss;
        const overlap =
          leftBoss.x + leftBoss.width + BOSS_SEPARATION_GAP - rightBoss.x;

        if (overlap <= 0) continue;

        const halfShift = overlap / 2;
        moveBossHorizontally(leftBoss, -halfShift);
        moveBossHorizontally(rightBoss, halfShift);
      }
    }
  }
}

// Y가 클수록 화면 앞쪽이다. Y가 같으면 DOM에서 나중에 생성된 보스가 위에 그려진다.
function compareBossDepth(leftBoss, rightBoss) {
  const yDifference = leftBoss.y - rightBoss.y;
  if (Math.abs(yDifference) > 0.01) return yDifference;
  return leftBoss.spawnOrder - rightBoss.spawnOrder;
}

function getFrontmostOverlappingBoss(bullet) {
  let frontmostBoss = null;

  bosses.forEach((boss) => {
    if (
      !rectsOverlap(
        bullet.x, bullet.y, BULLET_WIDTH, BULLET_HEIGHT,
        boss.x, boss.y, boss.width, boss.height
      )
    ) {
      return;
    }

    if (
      frontmostBoss === null ||
      compareBossDepth(frontmostBoss, boss) < 0
    ) {
      frontmostBoss = boss;
    }
  });

  return frontmostBoss;
}

function updateBosses(deltaTime) {
  bosses.forEach((boss) => updateSingleBoss(boss, deltaTime));
  separateOverlappingBosses();
}

function renderBosses() {
  const bossesBackToFront = [...bosses].sort(compareBossDepth);
  bossesBackToFront.forEach((boss, depthIndex) => {
    boss.el.style.left = boss.x + "px";
    boss.el.style.top = boss.y + "px";
    boss.el.style.zIndex = String(10 + depthIndex);
  });
}

function defeatBoss(boss) {
  const centerX = boss.x + boss.width / 2;
  const centerY = boss.y + boss.height / 2;
  spawnExplosion(centerX, centerY, BOSS_DEFEAT_EXPLOSION_SIZE, "cruiser");
  playExplosionSound("cruiser");

  boss.el.remove();
  bosses = bosses.filter((activeBoss) => activeBoss !== boss);
  bossFireballs = bossFireballs.filter((fireball) => {
    if (fireball.owner === boss) {
      fireball.el.remove();
      return false;
    }
    return true;
  });
  bonusScore += BOSS_DEFEAT_SCORE_BONUS;

  if (bosses.length === 0) {
    bossEncountersCompleted += 1;
    bossEncounterMaxHp = 0;
    bossEncounterTotalBosses = 0;
    updateStageDisplay();
  }
}

function spawnItem(centerX, centerY, typeKey) {
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

function getItemChargeRatio(typeKey) {
  if (typeKey === "shield") {
    return shieldCharges / MAX_SHIELD_CHARGES;
  }
  if (typeKey === "rapid") {
    return activePowerups.rapid.charges / BOLT_MAX_CHARGES;
  }
  return activePowerups.spread.charges / TRIDENT_MAX_CHARGES;
}

function chooseRandomItemType() {
  const typeKeys = Object.keys(ITEM_TYPES);
  return typeKeys[Math.floor(Math.random() * typeKeys.length)];
}

function choosePityItemType() {
  const candidates = Object.keys(ITEM_TYPES)
    .map((typeKey) => ({
      typeKey,
      chargeRatio: getItemChargeRatio(typeKey),
    }))
    .filter((candidate) => candidate.chargeRatio < 1);

  if (candidates.length === 0) return null;

  const lowestRatio = Math.min(
    ...candidates.map((candidate) => candidate.chargeRatio)
  );
  const lowestCandidates = candidates.filter(
    (candidate) => Math.abs(candidate.chargeRatio - lowestRatio) < 0.0001
  );
  return lowestCandidates[
    Math.floor(Math.random() * lowestCandidates.length)
  ].typeKey;
}

function getItemDropRule(baseChance) {
  // 화면에 주울 수 있는 아이템이 남아 있으면 천장·소프트 보정을 잠시 보류한다.
  if (items.length > 0) {
    return { chance: baseChance, guaranteed: false };
  }

  const secondsSincePickup = elapsedTime - lastItemPickupElapsedTime;
  const guaranteed =
    killsSinceItemPickup >= ITEM_PITY_HARD_KILLS ||
    secondsSincePickup >= ITEM_PITY_HARD_SECONDS;
  if (guaranteed) {
    return { chance: 1, guaranteed: true };
  }

  const bonusKills = Math.max(
    0,
    killsSinceItemPickup - ITEM_PITY_SOFT_START_KILLS
  );
  return {
    chance: Math.min(1, baseChance + bonusKills * ITEM_PITY_BONUS_PER_KILL),
    guaranteed: false,
  };
}

// 적 티어 또는 보스 피격 상황의 기본 확률 위에 획득 공백 보정을 적용한다.
function maybeDropItem(centerX, centerY, baseChance) {
  const dropRule = getItemDropRule(baseChance);
  if (!dropRule.guaranteed && Math.random() >= dropRule.chance) return false;

  const typeKey = dropRule.guaranteed
    ? choosePityItemType()
    : chooseRandomItemType();
  // 모든 모듈이 최대 충전이면 보장 드롭을 낭비하지 않고 천장 상태를 유지한다.
  if (typeKey === null) return false;
  spawnItem(centerX, centerY, typeKey);
  return true;
}

function resetItemPity() {
  killsSinceItemPickup = 0;
  lastItemPickupElapsedTime = elapsedTime;
}

function applyPowerup(type) {
  playItemSound(type);

  if (type === "shield") {
    shieldCharges = Math.min(shieldCharges + 1, MAX_SHIELD_CHARGES);
    return;
  }

  if (type === "rapid") {
    activePowerups.rapid.charges = Math.min(
      activePowerups.rapid.charges + BOLT_CHARGES_PER_ITEM,
      BOLT_MAX_CHARGES
    );
    return;
  }

  if (type === "spread") {
    const hadStoredCharge = activePowerups.spread.charges > 0;
    activePowerups.spread.charges = Math.min(
      activePowerups.spread.charges + TRIDENT_CHARGES_PER_ITEM,
      TRIDENT_MAX_CHARGES
    );
    activePowerups.spread.level = hadStoredCharge
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
  const hasSpreadCharge = activePowerups.spread.charges > 0;
  const hasRapidCharge = activePowerups.rapid.charges > 0;

  powerupSpreadEl.classList.toggle("hidden", !hasSpreadCharge);
  powerupRapidEl.classList.toggle("hidden", !hasRapidCharge);
  powerupShieldEl.classList.toggle("hidden", shieldCharges === 0);

  if (hasSpreadCharge) {
    powerupSpreadEl.querySelector(".powerup-bar-fill").style.width =
      (activePowerups.spread.charges / TRIDENT_MAX_CHARGES) * 100 + "%";
    powerupSpreadEl.querySelector(".powerup-name").textContent =
      activePowerups.spread.level >= SPREAD_MAX_LEVEL ? "TRIDENT ×6" : "TRIDENT ×3";
    powerupSpreadEl.querySelector(".powerup-charge").textContent =
      activePowerups.spread.charges + "/" + TRIDENT_MAX_CHARGES;
    powerupSpreadEl.setAttribute(
      "aria-label",
      "TRIDENT " + activePowerups.spread.charges + "회 남음"
    );
  }

  if (hasRapidCharge) {
    powerupRapidEl.querySelector(".powerup-bar-fill").style.width =
      (activePowerups.rapid.charges / BOLT_MAX_CHARGES) * 100 + "%";
    powerupRapidEl.querySelector(".powerup-charge").textContent =
      activePowerups.rapid.charges + "/" + BOLT_MAX_CHARGES;
    powerupRapidEl.setAttribute(
      "aria-label",
      "BOLT " + activePowerups.rapid.charges + "회 남음"
    );
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

  // 홀드 자동 연사는 BOLT 고유 기능이다. BOLT 충전이 없으면 SPACE+X(또는 M)를
  // 누르고 있어도 기본탄이 자동으로 나가지 않고, 눌렀을 때 한 발만 나간다.
  if (keys.has(" ") && isEnhanceKeyHeld() && activePowerups.rapid.charges > 0) {
    attemptFire(true);
  }

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

  bossFireballs.forEach((fireball) => {
    fireball.x += fireball.vx * deltaTime;
    fireball.y += fireball.vy * deltaTime;
  });

  bossFireballs = bossFireballs.filter((fireball) => {
    const offScreen =
      fireball.x + BOSS_FIREBALL_SIZE < 0 ||
      fireball.x > PLAY_WIDTH ||
      fireball.y + BOSS_FIREBALL_SIZE < 0 ||
      fireball.y > PLAY_HEIGHT;
    if (offScreen) {
      fireball.el.remove();
    }
    return !offScreen;
  });

  // 보스 경고 중이거나 보스가 살아있는 동안은 일반 스폰을 멈추고 보스에 집중하게 한다.
  // 이미 화면에 있던 적은 그대로 두고(자연스럽게 정리), 새로 만들지만 않는다.
  const bossEncounterActive = bosses.length > 0 || bossWarningRemaining > 0;

  if (!bossEncounterActive) {
    const currentSpawnInterval = Math.max(
      ENEMY_MIN_SPAWN_INTERVAL,
      ENEMY_SPAWN_INTERVAL - ENEMY_SPAWN_INTERVAL_DECAY * elapsedTime
    );

    enemySpawnTimer += deltaTime;
    if (enemySpawnTimer >= currentSpawnInterval) {
      enemySpawnTimer -= currentSpawnInterval;
      spawnEnemy();
    }
  }

  if (bossWarningRemaining > 0) {
    bossWarningRemaining -= deltaTime;
    if (bossWarningRemaining <= 0) {
      bossWarningRemaining = 0;
      bossWarningEl.classList.add("hidden");
      spawnBossEncounter();
    }
  } else if (bosses.length === 0 && killsTowardNextBoss >= BOSS_KILL_INTERVAL) {
    killsTowardNextBoss -= BOSS_KILL_INTERVAL;
    startBossWarning();
  }

  updateBosses(deltaTime);

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
      if (enemy.tier === "cruiser" && enemy.hp < ENEMY_TIERS.cruiser.hp) {
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
        killsSinceItemPickup += 1;
        maybeDropItem(centerX, centerY, ENEMY_TIERS[enemy.tier].itemDropChance);
        enemy.el.remove();
        return false;
      }
      return true;
    });
    enemiesDestroyed += destroyedEnemies.size;
    killsTowardNextBoss += destroyedEnemies.size;
  }

  // 보스들은 enemies 배열 밖의 별도 개체다. 일반 적을 못 맞힌 총알만 대상으로
  // 첫 번째로 겹친 보스 하나에만 피해를 적용해 총알 하나가 여러 보스를 관통하지 않게 한다.
  if (bosses.length > 0) {
    const hitsByBoss = new Map();
    bullets = bullets.filter((bullet) => {
      const hitBoss = getFrontmostOverlappingBoss(bullet);

      if (hitBoss) {
        const hitRecord = hitsByBoss.get(hitBoss) || {
          count: 0,
          impactX: bullet.x + BULLET_WIDTH / 2,
          impactY: bullet.y + BULLET_HEIGHT / 2,
        };
        hitRecord.count += 1;
        hitRecord.impactX = bullet.x + BULLET_WIDTH / 2;
        hitRecord.impactY = bullet.y + BULLET_HEIGHT / 2;
        hitsByBoss.set(hitBoss, hitRecord);
        return false;
      }
      return true;
    });

    hitsByBoss.forEach((hitRecord, boss) => {
      const centerX = boss.x + boss.width / 2;
      const centerY = boss.y + boss.height / 2;
      const hitCount = hitRecord.count;
      boss.hp -= hitCount;
      spawnImpactSpark(hitRecord.impactX, hitRecord.impactY, "boss");
      triggerBossHitFlash(boss);

      if (boss.hp <= 0) {
        defeatBoss(boss);
      } else {
        // 보스가 살아남은 피해만 누적하고 20 피해마다 20%로 한 번 판정한다.
        // 처치 타격에서는 기존 규칙대로 아이템이 나오지 않는다.
        boss.damageTowardItemDrop += hitCount;
        while (boss.damageTowardItemDrop >= BOSS_ITEM_DROP_DAMAGE_INTERVAL) {
          boss.damageTowardItemDrop -= BOSS_ITEM_DROP_DAMAGE_INTERVAL;
          maybeDropItem(centerX, centerY, BOSS_ITEM_DROP_CHANCE);
        }
        updateBossPhaseVisual(boss);
      }
    });
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

  // 보스는 몸으로 부딪혀도 파괴되지 않는다. 각 보스가 독립적인 접촉 쿨다운을
  // 가지므로 여러 보스가 동시에 닿으면 그 수만큼 피격으로 계산한다.
  let bossesHitPlayer = 0;
  bosses.forEach((boss) => {
    if (
      boss.playerHitCooldown <= 0 &&
      rectsOverlap(
        player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT,
        boss.x, boss.y, boss.width, boss.height
      )
    ) {
      bossesHitPlayer += 1;
      boss.playerHitCooldown = BOSS_PLAYER_HIT_COOLDOWN;
    }
  });

  // 화염탄은 총알로 파괴할 수 없는 별도 개체다 — 몸에 닿으면 소모되며 목숨을 깎는다.
  const collidedFireballs = new Set();
  bossFireballs.forEach((fireball) => {
    if (
      rectsOverlap(
        player.x, player.y, PLAYER_WIDTH, PLAYER_HEIGHT,
        fireball.x, fireball.y, BOSS_FIREBALL_SIZE, BOSS_FIREBALL_SIZE
      )
    ) {
      collidedFireballs.add(fireball);
    }
  });

  if (
    collidedWithPlayer.size > 0 ||
    bossesHitPlayer > 0 ||
    collidedFireballs.size > 0
  ) {
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

    if (collidedFireballs.size > 0) {
      bossFireballs = bossFireballs.filter((fireball) => {
        if (collidedFireballs.has(fireball)) {
          fireball.el.remove();
          return false;
        }
        return true;
      });
    }

    if (!isInvincible) {
      let unabsorbedHits =
        collidedWithPlayer.size + bossesHitPlayer + collidedFireballs.size;
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
    resetItemPity();
  }
}

function render() {
  renderPlayer();
  renderBullets();
  renderEnemies();
  renderBosses();
  renderBossFireballs();
  renderItems();
  updateScoreDisplay();
  updatePowerupHud();
}

function gameLoop(timestamp) {
  if (gameState !== "playing") return;

  if (isPaused) {
    // 재개 시 정지해 있던 시간을 델타로 계산하지 않도록 타임스탬프를 흘려보낸다.
    lastTimestamp = null;
    animationFrameId = requestAnimationFrame(gameLoop);
    return;
  }

  const deltaTime = getDeltaTime(timestamp);

  update(deltaTime);
  checkCollisions();

  if (lives <= 0) {
    beginPlayerDestruction();
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

function beginPlayerDestruction() {
  if (gameState !== "playing") return;

  gameState = "dying";
  stopLoop();
  keys.clear();
  backgroundMusic?.stop();
  spawnPlayerDestruction();
  triggerScreenShake();
  playPlayerDestructionSound();

  gameOverTimerId = window.setTimeout(() => {
    gameOverTimerId = null;
    finishGameOver();
  }, PLAYER_DEATH_DELAY_MS);
}

function finishGameOver() {
  if (gameState !== "dying") return;

  gameState = "gameOver";
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

function togglePause() {
  if (gameState !== "playing") return;

  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "RESUME" : "PAUSE";
  pauseButton.setAttribute("aria-pressed", String(isPaused));
  pauseOverlayEl.classList.toggle("hidden", !isPaused);

  if (isPaused) {
    backgroundMusic?.pause();
  } else {
    const context = ensureAudioContext();
    if (context !== null) {
      backgroundMusic?.start(context);
    }
  }
}

function startGame() {
  stopLoop();
  if (gameOverTimerId !== null) {
    clearTimeout(gameOverTimerId);
    gameOverTimerId = null;
  }
  gameState = "playing";
  isPaused = false;
  pauseButton.textContent = "PAUSE";
  pauseButton.setAttribute("aria-pressed", "false");
  pauseOverlayEl.classList.add("hidden");
  enemiesDestroyed = 0;
  elapsedTime = 0;
  killsSinceItemPickup = 0;
  lastItemPickupElapsedTime = 0;
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
    spread: { charges: 0, level: 0 },
    rapid: { charges: 0 },
  };
  updatePowerupHud();
  // 보스/화염탄 el은 playArea.innerHTML 초기화(createPlayer 안)로 이미 같이
  // 지워지므로 여기서는 상태값만 리셋하면 된다.
  bosses = [];
  bossFireballs = [];
  bossEncountersCompleted = 0;
  bossEncounterMaxHp = 0;
  bossEncounterTotalBosses = 0;
  bossWarningRemaining = 0;
  killsTowardNextBoss = 0;
  bonusScore = 0;
  updateStageDisplay();
  bossWarningEl.classList.add("hidden");
  playArea.classList.remove("shake");
  createPlayer();
  showScreen(gameScreen);
  const context = ensureAudioContext();
  if (context !== null) {
    backgroundMusic?.start(context, { restart: true, delay: 0.38 });
  }
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
pauseButton.addEventListener("click", togglePause);
startPlayerNameInput.addEventListener("input", () => {
  clearNameError(startPlayerNameInput, startNameError);
});
restartPlayerNameInput.addEventListener("input", () => {
  clearNameError(restartPlayerNameInput, restartNameError);
});
prewarmGpuEffects();
