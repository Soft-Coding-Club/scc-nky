// 각 iMac에서 도는 클라이언트 — 서버가 필요 없는 정적 버전.
//
// 개념: 삼각형 한가운데 선 관객은 한 번에 한 화면만 정면으로 본다.
// 그래서 각 화면은 "지금 누가 나를 정면으로 응시하나?"만 스스로 판단하면 된다.
//  - 응시받는 화면(눈 마주침) → 좋은 말(kind)
//  - 응시받지 못하는 화면(등 뒤)   → 욕(mean)
// 관객이 한 화면을 보면 나머지 두 화면은 옆얼굴/뒤통수만 잡히므로 자동으로 욕한다.

import { KIND, MEAN } from './texts.js';

const params = new URLSearchParams(location.search);
const DEVICE_ID = params.get('id') || '-';

const gate = document.getElementById('gate');
const startBtn = document.getElementById('startBtn');
const video = document.getElementById('cam');
const wordEl = document.getElementById('word');
const debugEl = document.getElementById('debug');

let mode = 'mean';
let faceDetector = null;
let camReady = false;
let rawScore = 0;
let ema = 0;
let lastVideoTime = -1;
let status = 'idle';
let lastDetectionAt = 0;
let heldScore = 0;
let lastDetectAt = 0;

// MediaPipe에는 화면에 보이지 않는 보정 캔버스를 입력한다. 카메라 원본은
// 건드리지 않기 때문에 설치 화면의 검은색 비주얼은 그대로 유지할 수 있다.
const detectCanvas = document.createElement('canvas');
const detectCtx = detectCanvas.getContext('2d');
const probeCanvas = document.createElement('canvas');
const probeCtx = probeCanvas.getContext('2d', { willReadFrequently: true });
probeCanvas.width = 48;
probeCanvas.height = 36;

let luminance = 1;
let enhanceGain = 1;
let lastLightProbeAt = 0;
let lowLight = false;

const ENTER_KIND = 0.5;
const EXIT_KIND = 0.3;
const EMA_A = 0.25;
const DETECT_INTERVAL_MS = 66; // 약 15 fps: 발열과 캔버스 readback을 제한한다.
const LIGHT_PROBE_INTERVAL_MS = 450;
const FACE_HOLD_MS = 700;
const LOW_LIGHT_ENTER = 0.2;
const LOW_LIGHT_EXIT = 0.28;

function pick(list, ref) {
  if (list.length === 1) return list[0];
  let i;
  do {
    i = Math.floor(Math.random() * list.length);
  } while (i === ref.v);
  ref.v = i;
  return list[i];
}

const kindRef = { v: -1 };
const meanRef = { v: -1 };

function nextWord() {
  const list = mode === 'kind' ? KIND : MEAN;
  const ref = mode === 'kind' ? kindRef : meanRef;
  wordEl.textContent = pick(list, ref);
  wordEl.classList.add('show');
}

let loopTimer = null;
function runLoop() {
  const dwell = mode === 'kind' ? 3600 : 2400;
  nextWord();
  loopTimer = setTimeout(runLoop, dwell);
}

function setMode(next) {
  if (next === mode) return;
  mode = next;
  document.body.classList.toggle('mode-kind', mode === 'kind');
  document.body.classList.toggle('mode-mean', mode === 'mean');
  if (loopTimer) clearTimeout(loopTimer);
  runLoop();
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 960 },
      height: { ideal: 720 },
      frameRate: { ideal: 30, max: 30 },
      facingMode: 'user',
    },
    audio: false,
  });

  // 지원하는 카메라에서만 연속 자동 노출을 명시적으로 켠다.
  const track = stream.getVideoTracks()[0];
  try {
    const capabilities = track.getCapabilities?.() || {};
    const advanced = {};
    if (capabilities.exposureMode?.includes('continuous')) {
      advanced.exposureMode = 'continuous';
    }
    if (capabilities.whiteBalanceMode?.includes('continuous')) {
      advanced.whiteBalanceMode = 'continuous';
    }
    if (Object.keys(advanced).length) {
      await track.applyConstraints({ advanced: [advanced] });
    }
  } catch (err) {
    // 브라우저/카메라마다 지원 범위가 다르므로 실패해도 기본 자동 노출로 진행한다.
    console.info('카메라 자동 노출 설정을 적용하지 못했습니다:', err);
  }

  video.srcObject = stream;
  await video.play();

  // 검출 비용은 640px로 제한한다. 원본 종횡비는 유지한다.
  detectCanvas.width = 640;
  detectCanvas.height = Math.max(1, Math.round(640 * video.videoHeight / video.videoWidth));
  camReady = true;
}

async function loadDetector() {
  status = 'vision 로딩';
  const { FaceDetector, FilesetResolver } = await import(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs'
  );
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
  );
  status = '모델 로딩';
  faceDetector = await FaceDetector.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    minDetectionConfidence: 0.35,
  });
  status = 'ok';
}

function scoreFromResult(result, sourceWidth, sourceHeight) {
  const dets = result && result.detections;
  if (!dets || dets.length === 0) return 0;

  let best = 0;
  for (const det of dets) {
    const kp = det.keypoints;
    if (!kp || kp.length < 6) continue;
    const nose = kp[2];
    const earA = kp[4];
    const earB = kp[5];
    const leftX = Math.min(earA.x, earB.x);
    const rightX = Math.max(earA.x, earB.x);
    const width = rightX - leftX;
    if (width < 1e-4) continue;

    const ratioX = (nose.x - leftX) / width;
    const frontalX = Math.max(0, 1 - Math.abs(ratioX - 0.5) / 0.16);

    const eyeY = (kp[0].y + kp[1].y) / 2;
    const mouthY = kp[3].y;
    const spanY = mouthY - eyeY || 1;
    const ratioY = (nose.y - eyeY) / spanY;
    const frontalY = Math.max(0, 1 - Math.abs(ratioY - 0.45) / 0.3);

    const frontal = frontalX * (0.6 + 0.4 * frontalY);

    const bb = det.boundingBox;
    let proximity = 0.6;
    if (bb && sourceWidth) {
      const nw = bb.width / sourceWidth;
      const nh = bb.height / sourceHeight;
      proximity = Math.min(1, (nw * nh) / 0.05);
    }

    // 낮춘 검출 임계값에서 생길 수 있는 오검출은 모델 confidence로 다시 감쇠한다.
    const confidence = det.categories?.[0]?.score ?? 1;
    const confidenceWeight = Math.max(0.55, Math.min(1, confidence / 0.7));
    const score = frontal * (0.55 + 0.45 * proximity) * confidenceWeight;
    if (score > best) best = score;
  }
  return Math.max(0, Math.min(1, best));
}

function measureLight(now) {
  if (now - lastLightProbeAt < LIGHT_PROBE_INTERVAL_MS) return;
  lastLightProbeAt = now;

  probeCtx.drawImage(video, 0, 0, probeCanvas.width, probeCanvas.height);
  const pixels = probeCtx.getImageData(0, 0, probeCanvas.width, probeCanvas.height).data;
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    total += (0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2]) / 255;
  }
  const measured = total / (pixels.length / 4);
  luminance += 0.35 * (measured - luminance);

  // 목표 평균 밝기(약 38%)까지 올리되 노이즈 폭증을 막기 위해 3배로 제한한다.
  const desiredGain = Math.max(1, Math.min(3, 0.38 / Math.max(0.04, luminance)));
  enhanceGain += 0.3 * (desiredGain - enhanceGain);

  if (!lowLight && luminance < LOW_LIGHT_ENTER) lowLight = true;
  else if (lowLight && luminance > LOW_LIGHT_EXIT) lowLight = false;
  document.body.classList.toggle('low-light', lowLight);
}

function prepareDetectionFrame(now) {
  measureLight(now);
  detectCtx.save();
  detectCtx.clearRect(0, 0, detectCanvas.width, detectCanvas.height);
  // brightness는 암부를 들어 올리고 contrast는 얼굴 특징이 씻겨 나가는 것을 줄인다.
  detectCtx.filter = `brightness(${enhanceGain.toFixed(2)}) contrast(1.12)`;
  detectCtx.drawImage(video, 0, 0, detectCanvas.width, detectCanvas.height);
  detectCtx.restore();
}

function detectLoop(now) {
  if (
    faceDetector &&
    camReady &&
    video.currentTime !== lastVideoTime &&
    now - lastDetectAt >= DETECT_INTERVAL_MS
  ) {
    lastDetectAt = now;
    lastVideoTime = video.currentTime;
    try {
      prepareDetectionFrame(now);
      const result = faceDetector.detectForVideo(detectCanvas, now);
      const detectedScore = scoreFromResult(result, detectCanvas.width, detectCanvas.height);

      if (detectedScore > 0.08) {
        rawScore = detectedScore;
        heldScore = detectedScore;
        lastDetectionAt = now;
      } else if (now - lastDetectionAt < FACE_HOLD_MS) {
        // 한두 프레임의 저조도 검출 누락으로 상태가 뒤집히지 않게 짧게 유지한다.
        rawScore = heldScore * (1 - 0.25 * (now - lastDetectionAt) / FACE_HOLD_MS);
      } else {
        rawScore = 0;
        heldScore = 0;
      }
    } catch {
      rawScore = 0;
    }
    ema = ema + EMA_A * (rawScore - ema);

    if (mode === 'mean' && ema >= ENTER_KIND) setMode('kind');
    else if (mode === 'kind' && ema < EXIT_KIND) setMode('mean');
  }
  updateDebug();
  requestAnimationFrame(detectLoop);
}

let debugOn = false;
function updateDebug() {
  if (!debugOn) return;
  debugEl.textContent = [
    `device : ${DEVICE_ID}`,
    `mode   : ${mode}`,
    `raw    : ${rawScore.toFixed(3)}`,
    `ema    : ${ema.toFixed(3)}`,
    `light  : ${luminance.toFixed(3)}${lowLight ? ' (low)' : ''}`,
    `gain   : ${enhanceGain.toFixed(2)}x`,
    `status : ${status}`,
  ].join('\n');
}

window.addEventListener('keydown', (e) => {
  if (e.key === 'd' || e.key === 'D') {
    debugOn = !debugOn;
    debugEl.classList.toggle('hidden', !debugOn);
  }
  if (e.key === 'f' || e.key === 'F') document.documentElement.requestFullscreen?.();
});

async function start() {
  gate.classList.add('hidden');
  document.body.classList.add('mode-mean');

  try {
    await document.documentElement.requestFullscreen?.();
  } catch {}

  runLoop();

  (async () => {
    try {
      await startCamera();
      await loadDetector();
      requestAnimationFrame(detectLoop);
    } catch (err) {
      status = 'cam/model 실패';
      console.error('카메라/모델 초기화 실패:', err);
    }
  })();
}

startBtn.addEventListener('click', start);
