import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

const canvas = document.querySelector("#canvas");
const ctx = canvas.getContext("2d");
const modeButtons = [...document.querySelectorAll(".mode")];
const exportButtons = [...document.querySelectorAll(".export-button")];
const pngButton = document.querySelector("#png");
const gifButton = document.querySelector("#gif");
const movButton = document.querySelector("#mov");
const playButton = document.querySelector("#playpause");
const durationInput = document.querySelector("#duration");
const status = document.querySelector("#status");

// 장면은 1024 좌표계에서 한 번만 정의하고, 미리보기와 내보내기가
// 크기만 스케일해서 같은 코드를 쓴다. (미리보기 == 결과물 보장)
const BASE = 1024;
const CX = BASE / 2;
const CY = BASE / 2;
// SCC 로고 SVG(viewBox 218x201)에서 실측한 값. 글자 중심과 글자 높이만 있으면
// 배치 비율이 결정된다. 정삼각형이 아니라 살짝 납작한 이등변삼각형이다.
//   C↔C 가로 = 캡하이트의 2.274배 / S→C 세로 = 1.836배
const LOGO_CAP = 70.56;
const LOGO_ANCHORS = [
  { x: 110.01, y: 35.23 }, // S
  { x: 28.51, y: 164.81 }, // C 좌하
  { x: 188.94, y: 164.81 }, // C 우하
];

// 회전(V1) 중에도 글자가 안 잘리도록 잡은 여유. 키우면 로고가 커지고 빡빡해진다.
const LOGO_FIT = 0.92;

// 세 글자에서 거리가 같은 유일한 점(외심). 회전축은 반드시 여기여야 세 글자가
// 하나의 원 위를 돈다. 무게중심은 5.7%, 앵커 박스 중심은 42% 어긋난다.
function circumcenter([a, b, c]) {
  const d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y));
  const sa = a.x * a.x + a.y * a.y;
  const sb = b.x * b.x + b.y * b.y;
  const sc = c.x * c.x + c.y * c.y;
  return {
    x: (sa * (b.y - c.y) + sb * (c.y - a.y) + sc * (a.y - b.y)) / d,
    y: (sa * (c.x - b.x) + sb * (a.x - c.x) + sc * (b.x - a.x)) / d,
  };
}

// V1 은 이 점을 축으로 돌고, 화면도 이 점을 중심으로 잡아야 도는 내내 중앙을 지킨다.
// V2/V3 도 같은 기준을 써서 모드를 바꿔도 글자가 제자리에 그대로 있는다.
const ROTATION_CENTER = circumcenter(LOGO_ANCHORS);

// 세 글자가 같은 원 위에 있으므로 반지름은 하나뿐이다.
const LOGO_RADIUS = Math.hypot(
  LOGO_ANCHORS[0].x - ROTATION_CENTER.x,
  LOGO_ANCHORS[0].y - ROTATION_CENTER.y,
);

// 회전 반경 = 원 반지름 + 글자 자체 반경. 모드가 바뀌어도 글자 크기는 같아야 하므로
// 더 빡빡한 V1 기준으로 한 번만 정한다.
const LOGO_SCALE = ((BASE / 2) * LOGO_FIT) / (LOGO_RADIUS + LOGO_CAP * 0.95);

// 폰트마다 em 대비 글자 높이가 제각각이라 px 크기를 고정하면 크기가 들쭉날쭉해진다.
// 대신 "S" 의 실측 높이를 이 값에 맞춰 폰트별 px 크기를 역산한다.
const TARGET_CAP_HEIGHT = LOGO_CAP * LOGO_SCALE;
const MEASURE_SIZE = 200; // 실측용 기준 크기

const ROTATION_DURATION = 6; // V1 한 바퀴(초)
const FONT_STEP_MS = 650; // V2 폰트 교체 주기
const COLOR_STEP_MS = 400; // V3 색 교체 주기

const PNG_SIZE = 1600;
const GIF_SIZE = 720;
const GIF_FPS = 20;
const VIDEO_SIZE = 1080;
const VIDEO_FPS = 60;

// @ffmpeg/core 는 @ffmpeg/ffmpeg 과 버전 체계가 다르다. 최신은 0.12.10.
// (0.12.15 는 존재하지 않는 버전이라 404 -> CORS 에러로 죽는다.)
// 워커가 type:"module" 로 생성돼 import() 로 코어를 읽으므로 esm 빌드를 쓴다.
const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";

const LETTERS = ["S", "C", "C"];

let currentMode = 1;
let baseTime = performance.now();
let paused = false;
let pausedElapsed = 0; // 일시정지한 시점의 경과 시간(ms)
let busy = true;
let ready = false;
let ffmpeg = null;
let encodingLabel = "";

const fonts = [
  { family: '"Abril Fatface", serif', weight: 400 },
  { family: '"Alfa Slab One", serif', weight: 400 },
  { family: '"Anton", sans-serif', weight: 400 },
  { family: '"Archivo Black", sans-serif', weight: 400 },
  { family: '"Bebas Neue", sans-serif', weight: 400 },
  { family: '"Bodoni Moda", serif', weight: 900 },
  { family: '"Bowlby One SC", serif', weight: 400 },
  { family: '"Bungee", sans-serif', weight: 400 },
  { family: '"Cinzel", serif', weight: 900 },
  { family: '"Cormorant Garamond", serif', weight: 700 },
  { family: '"DM Serif Display", serif', weight: 400 },
  { family: '"Faster One", cursive', weight: 400 },
  { family: '"Fraunces", serif', weight: 900 },
  { family: '"Instrument Serif", serif', weight: 400 },
  { family: '"Lobster", cursive', weight: 400 },
  { family: '"Major Mono Display", monospace', weight: 400 },
  { family: '"Monoton", cursive', weight: 400 },
  { family: '"Orbitron", sans-serif', weight: 900 },
  { family: '"Oswald", sans-serif', weight: 700 },
  { family: '"Pacifico", cursive', weight: 400 },
  { family: '"Playfair Display", serif', weight: 900 },
  { family: '"Prata", serif', weight: 400 },
  { family: '"Press Start 2P", monospace', weight: 400 },
  { family: '"Righteous", sans-serif', weight: 400 },
  { family: '"Rubik Mono One", sans-serif', weight: 400 },
  { family: '"Silkscreen", monospace', weight: 700 },
  { family: '"Space Grotesk", sans-serif', weight: 700 },
  { family: '"Space Mono", monospace', weight: 700 },
  { family: '"Staatliches", sans-serif', weight: 400 },
  { family: '"Syne", sans-serif', weight: 800 },
  { family: '"Titan One", sans-serif', weight: 400 },
  { family: '"Unbounded", sans-serif', weight: 900 },
  { family: '"Yeseva One", serif', weight: 400 },
];

const DEFAULT_FONT = {
  family: '"Playfair Display", Georgia, serif',
  weight: 600,
};

// 무작위 단색 대신 3색이 서로 어울리는 배색 묶음. 한 팔레트가 세 스텝 동안
// 유지되면서 글자끼리 색만 돌아가고, 그 다음 팔레트로 넘어간다.
const palettes = [
  ["#FF3B5C", "#FFB000", "#00C2A8"], // pop
  ["#FF2E9A", "#7B4DFF", "#2E9BFF"], // neon
  ["#FF6B00", "#FFC300", "#00C853"], // citrus
  ["#FF5E5B", "#FFAF3A", "#4ECDC4"], // reef
  ["#00D9C0", "#22A7F0", "#FF4D8D"], // electric
  ["#FF2D95", "#5C6BFF", "#12C2E9"], // vice
  ["#E71D36", "#FF9F1C", "#2EC4B6"], // ember
  ["#7ED321", "#00C2A8", "#FFB627"], // meadow
  ["#FF4E8B", "#FFA23A", "#35C4FF"], // candy
  ["#E040FB", "#FF4081", "#7C4DFF"], // orchid
  ["#00C8FF", "#00D68F", "#FFC93C"], // lagoon
  ["#FF6F91", "#FF9671", "#FFB000"], // sorbet
  ["#00E0A4", "#FF3CAC", "#3B82F6"], // cyber
  ["#F94144", "#F8961E", "#43AA8B"], // fiesta
  ["#00E5FF", "#A855F7", "#FF5FA2"], // aurora
];

// 로고 좌표를 캔버스 중심 기준으로 옮긴 것. 세 모드 모두 같은 기준(외심)을 써서
// V1/V2/V3 의 글자 위치가 완전히 일치한다.
const letterAnchors = LOGO_ANCHORS.map((p) => ({
  x: (p.x - ROTATION_CENTER.x) * LOGO_SCALE,
  y: (p.y - ROTATION_CENTER.y) * LOGO_SCALE,
}));

const exportNames = {
  1: "v1-rotate",
  2: "v2-type",
  3: "v3-color",
};

// V2/V3 는 목록을 순서대로 도는 게 아니라 스텝마다 새로 뽑는다. 다만 미리보기와
// 내보내기가 같은 그림이어야 하므로 Math.random 대신 스텝 번호 해시를 쓴다.
function hash32(n) {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

// count 개 중 n 개를 겹치지 않게. 같은 step 이면 항상 같은 결과.
function pickDistinct(step, salt, count, n) {
  const picked = [];
  for (let slot = 0; slot < n; slot += 1) {
    let index = hash32(step * 1013 + salt * 97 + slot) % count;
    while (picked.includes(index)) index = (index + 1) % count;
    picked.push(index);
  }
  return picked;
}

// 직전 스텝과 같은 팔레트가 걸리면 한 칸 밀어서 매번 확실히 달라지게 한다.
function pickPalette(step) {
  const index = hash32(step * 7919) % palettes.length;
  const prev = hash32((step - 1) * 7919) % palettes.length;
  return step > 0 && index === prev ? (index + 1) % palettes.length : index;
}

// 폰트별 실측 크기 캐시. 웹폰트 로드 전에 잰 값은 폴백 폰트 기준이라
// 로드가 끝나면 비운다.
const measureCanvas = document.createElement("canvas");
const measureCtx = measureCanvas.getContext("2d");
const fontSizeCache = new Map();

function fontSizeFor(font) {
  const key = `${font.weight} ${font.family}`;
  const cached = fontSizeCache.get(key);
  if (cached) return cached;

  measureCtx.font = `${font.weight} ${MEASURE_SIZE}px ${font.family}`;
  const metrics = measureCtx.measureText("S");
  const capHeight =
    (metrics.actualBoundingBoxAscent || 0) +
    (metrics.actualBoundingBoxDescent || 0);

  const size =
    capHeight > 0 ? (MEASURE_SIZE * TARGET_CAP_HEIGHT) / capHeight : MEASURE_SIZE;
  fontSizeCache.set(key, size);
  return size;
}

function setStatus(message) {
  if (status) status.textContent = message;
}

function setBusy(value) {
  busy = value;
  const disabled = value || !ready;
  [...modeButtons, ...exportButtons, playButton].forEach((button) => {
    button.disabled = disabled;
  });
  durationInput.disabled = disabled;
}

function setMode(mode) {
  currentMode = mode;
  baseTime = performance.now();
  pausedElapsed = 0; // 모드를 바꾸면 처음부터 (일시정지 상태는 유지)
  modeButtons.forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.mode) === mode);
  });
}

// 미리보기의 현재 재생 위치. 일시정지 중에는 멈춘 시점에 고정된다.
function elapsedMs() {
  return paused ? pausedElapsed : performance.now() - baseTime;
}

function setPaused(value) {
  if (paused === value) return;

  if (value) {
    pausedElapsed = performance.now() - baseTime;
  } else {
    // 멈춘 지점에서 이어서 재생
    baseTime = performance.now() - pausedElapsed;
  }

  paused = value;
  playButton.textContent = paused ? "Play" : "Pause";
  playButton.classList.toggle("active", paused);
  setStatus(paused ? `Paused at ${(pausedElapsed / 1000).toFixed(2)}s` : "Ready");
}

// --- 장면 렌더링 (1024 좌표계) ---------------------------------------------

function drawScene(c, timeMs, mode) {
  // 캔버스는 순수 흰 배경만. 미리보기의 프레임 감(感)은 CSS 그림자로 주므로
  // 내보낸 파일에는 어떤 테두리도 섞이지 않는다.
  c.fillStyle = "#ffffff";
  c.fillRect(0, 0, BASE, BASE);

  const angle =
    mode === 1 ? (timeMs / 1000 / ROTATION_DURATION) * Math.PI * 2 : 0;

  c.save();
  c.translate(CX, CY);
  c.rotate(angle);

  const fontStep = Math.floor(timeMs / FONT_STEP_MS);
  const fontPick =
    mode === 2 ? pickDistinct(fontStep, 1, fonts.length, LETTERS.length) : null;

  const colorStep = Math.floor(timeMs / COLOR_STEP_MS);
  const palette = palettes[pickPalette(colorStep)];
  const colorPick =
    mode === 3 ? pickDistinct(colorStep, 2, palette.length, LETTERS.length) : null;

  letterAnchors.forEach((point, index) => {
    const font = mode === 2 ? fonts[fontPick[index]] : DEFAULT_FONT;
    const color = mode === 3 ? palette[colorPick[index]] : "#000000";

    c.save();
    c.translate(point.x, point.y);
    if (mode === 1) c.rotate(-angle); // 글자는 항상 정방향

    c.fillStyle = color;
    c.font = `${font.weight} ${fontSizeFor(font)}px ${font.family}`;
    c.textAlign = "left";
    c.textBaseline = "alphabetic";

    // textAlign/textBaseline 은 글리프의 여백까지 포함해 정렬하므로 폰트마다
    // 실제 글자 위치가 어긋난다. 잉크 자체의 바운딩박스 중심을 앵커에 맞춘다.
    const letter = LETTERS[index];
    const metrics = c.measureText(letter);
    const dx = (metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2;
    const dy = (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2;

    c.fillText(letter, dx, dy);
    c.restore();
  });

  c.restore();
}

function renderTo(c, size, timeMs, mode) {
  const scale = size / BASE;
  c.setTransform(scale, 0, 0, scale, 0, 0);
  drawScene(c, timeMs, mode);
  c.setTransform(1, 0, 0, 1, 0, 0);
}

function tick() {
  renderTo(ctx, canvas.width, elapsedMs(), currentMode);
  requestAnimationFrame(tick);
}

// --- 폰트 -------------------------------------------------------------------

// 웹폰트는 DOM 에서 쓰여야 로드된다. canvas 에서만 쓰면 폴백으로 그려지므로
// 그리기 전에 명시적으로 로드해 둔다.
async function loadFonts() {
  const specs = new Set(
    [DEFAULT_FONT, ...fonts].map(
      (font) => `${font.weight} ${MEASURE_SIZE}px ${font.family}`,
    ),
  );

  await Promise.all(
    [...specs].map((spec) =>
      document.fonts.load(spec, LETTERS.join("")).catch(() => {}),
    ),
  );
  await document.fonts.ready;

  // 폴백 폰트로 잰 값 폐기 — 이제부터 진짜 폰트로 다시 잰다.
  fontSizeCache.clear();
}

// --- 내보내기 ---------------------------------------------------------------

function clampedDuration() {
  const value = Number(durationInput.value);
  if (!Number.isFinite(value)) return 6;
  return Math.min(20, Math.max(1, value));
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function ensureFFmpeg() {
  if (ffmpeg) return ffmpeg;

  setStatus("Loading ffmpeg…");
  const instance = new FFmpeg();

  instance.on("progress", ({ progress }) => {
    if (!encodingLabel) return;
    const percent = Math.min(100, Math.max(0, Math.round(progress * 100)));
    setStatus(`${encodingLabel}: encoding ${percent}%`);
  });

  await instance.load({
    coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpeg = instance;
  return ffmpeg;
}

async function removeFiles(runtime, names) {
  for (const name of names) {
    try {
      await runtime.deleteFile(name);
    } catch {
      // 없는 파일은 무시
    }
  }
}

async function writeFrames({ size, fps, duration, mode, label }) {
  const runtime = await ensureFFmpeg();
  const total = Math.max(1, Math.round(duration * fps));

  const temp = document.createElement("canvas");
  temp.width = size;
  temp.height = size;
  const tempCtx = temp.getContext("2d");

  const names = [];
  for (let i = 0; i < total; i += 1) {
    renderTo(tempCtx, size, (i / fps) * 1000, mode);
    const blob = await new Promise((resolve) =>
      temp.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("프레임 생성 실패");

    const name = `frame-${String(i).padStart(4, "0")}.png`;
    await runtime.writeFile(name, await fetchFile(blob));
    names.push(name);
    setStatus(`${label}: rendering frame ${i + 1}/${total}`);
  }

  return { runtime, names };
}

async function run(runtime, args) {
  const code = await runtime.exec(args);
  if (code !== 0) throw new Error(`ffmpeg exit ${code}`);
}

function exportPng() {
  const temp = document.createElement("canvas");
  temp.width = PNG_SIZE;
  temp.height = PNG_SIZE;
  renderTo(temp.getContext("2d"), PNG_SIZE, elapsedMs(), currentMode);

  return new Promise((resolve, reject) => {
    temp.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG 생성 실패"));
    }, "image/png");
  });
}

async function exportGif(duration) {
  const { runtime, names } = await writeFrames({
    size: GIF_SIZE,
    fps: GIF_FPS,
    duration,
    mode: currentMode,
    label: "GIF",
  });

  try {
    encodingLabel = "GIF";
    // 팔레트 2패스 — 기본 256색 그대로 쓰면 색이 뭉갠다.
    await run(runtime, [
      "-framerate",
      String(GIF_FPS),
      "-i",
      "frame-%04d.png",
      "-vf",
      "palettegen=stats_mode=diff",
      "-y",
      "palette.png",
    ]);
    await run(runtime, [
      "-framerate",
      String(GIF_FPS),
      "-i",
      "frame-%04d.png",
      "-i",
      "palette.png",
      "-lavfi",
      "paletteuse=dither=bayer:bayer_scale=3",
      "-loop",
      "0",
      "-y",
      "output.gif",
    ]);

    const data = await runtime.readFile("output.gif");
    return new Blob([data], { type: "image/gif" });
  } finally {
    encodingLabel = "";
    await removeFiles(runtime, [...names, "palette.png", "output.gif"]);
  }
}

async function exportMov(duration) {
  const { runtime, names } = await writeFrames({
    size: VIDEO_SIZE,
    fps: VIDEO_FPS,
    duration,
    mode: currentMode,
    label: "MOV",
  });

  try {
    encodingLabel = "MOV";
    await run(runtime, [
      "-framerate",
      String(VIDEO_FPS),
      "-i",
      "frame-%04d.png",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-y",
      "output.mov",
    ]);

    const data = await runtime.readFile("output.mov");
    return new Blob([data], { type: "video/quicktime" });
  } finally {
    encodingLabel = "";
    await removeFiles(runtime, [...names, "output.mov"]);
  }
}

async function runExport(kind) {
  if (busy || !ready) return;
  setBusy(true);

  const startedAt = performance.now();
  const name = exportNames[currentMode] || "scc";
  const duration = clampedDuration();

  try {
    let blob;
    if (kind === "png") blob = await exportPng();
    else if (kind === "gif") blob = await exportGif(duration);
    else blob = await exportMov(duration);

    downloadBlob(blob, `${name}.${kind}`);

    const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
    const mb = (blob.size / 1024 / 1024).toFixed(2);
    setStatus(`Done — ${name}.${kind}, ${mb} MB, ${seconds}s`);
  } catch (error) {
    console.error(error);
    setStatus(`Error: ${error?.message || error}`);
  } finally {
    setBusy(false);
  }
}

// --- 시작 -------------------------------------------------------------------

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(Number(button.dataset.mode)));
});

playButton.addEventListener("click", () => setPaused(!paused));

canvas.addEventListener("click", () => {
  if (!busy && ready) setPaused(!paused);
});

pngButton.addEventListener("click", () => runExport("png"));
gifButton.addEventListener("click", () => runExport("gif"));
movButton.addEventListener("click", () => runExport("mov"));

durationInput.addEventListener("change", () => {
  durationInput.value = String(clampedDuration());
});

setBusy(true);
requestAnimationFrame(tick);

setStatus("Loading fonts…");
loadFonts()
  .catch((error) => console.warn("폰트 로드 실패, 폴백으로 진행", error))
  .finally(() => {
    ready = true;
    baseTime = performance.now();
    setBusy(false);
    setStatus("Ready");
  });
