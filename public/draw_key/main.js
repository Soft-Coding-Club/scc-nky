const canvas = document.querySelector('#drawing');
const context = canvas.getContext('2d');

// Use physical key positions so the path follows the keyboard, even in Korean input mode.
const keyPositions = new Map();
const rows = [
  {
    codes: ['Backquote', ...[...'1234567890'].map((key) => `Digit${key}`), 'Minus', 'Equal'],
    x: -1,
    y: 0,
  },
  {
    codes: [...[...'QWERTYUIOP'].map((key) => `Key${key}`), 'BracketLeft', 'BracketRight', 'Backslash'],
    x: 0.45,
    y: 1,
  },
  {
    codes: [...[...'ASDFGHJKL'].map((key) => `Key${key}`), 'Semicolon', 'Quote'],
    x: 0.72,
    y: 2,
  },
  {
    codes: [...[...'ZXCVBNM'].map((key) => `Key${key}`), 'Comma', 'Period', 'Slash'],
    x: 1.18,
    y: 3,
  },
];

for (const row of rows) {
  row.codes.forEach((code, index) => {
    keyPositions.set(code, {
      x: row.x + index,
      y: row.y,
    });
  });
}

const arrowDirections = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};

const points = [{ x: 0, y: 0 }];
const strokeStarts = new Set();
const camera = { x: 0, y: 0, scale: 1 };
const target = { x: 0, y: 0, scale: 1 };
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let width = 0;
let height = 0;
let pixelRatio = 1;
let idleTimer;
let frame;
let lastFrameTime;
let isOverview = false;
let previousKeyPosition = null;
let lastKeyDirection = null;
let awaitingFirstKey = true;
let startNewStroke = false;

const stepLength = 31;

function resize() {
  const bounds = canvas.getBoundingClientRect();
  width = bounds.width;
  height = bounds.height;
  pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  render();
}

function render() {
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.clearRect(0, 0, width, height);

  context.translate(width / 2, height / 2);
  context.scale(camera.scale, camera.scale);
  context.translate(-camera.x, -camera.y);

  if (points.length > 1) {
    context.beginPath();
    context.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length; index += 1) {
      if (strokeStarts.has(index)) {
        context.moveTo(points[index - 1].x, points[index - 1].y);
      }
      context.lineTo(points[index].x, points[index].y);
    }
    context.strokeStyle = '#191919';
    context.lineWidth = 1.5 / camera.scale;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.stroke();
  }

  const current = points[points.length - 1];
  context.beginPath();
  context.arc(current.x, current.y, 2.4 / camera.scale, 0, Math.PI * 2);
  context.fillStyle = '#171717';
  context.fill();
}

function animate(time) {
  const delta = lastFrameTime === undefined ? 16 : Math.min(time - lastFrameTime, 64);
  lastFrameTime = time;

  if (reducedMotion.matches) {
    Object.assign(camera, target);
  } else {
    const move = 1 - Math.exp(-delta / 105);
    const zoom = 1 - Math.exp(-delta / 250);
    camera.x += (target.x - camera.x) * move;
    camera.y += (target.y - camera.y) * move;
    camera.scale += (target.scale - camera.scale) * zoom;
  }

  render();

  const moving = Math.abs(target.x - camera.x) > 0.05 ||
    Math.abs(target.y - camera.y) > 0.05 ||
    Math.abs(target.scale - camera.scale) > 0.001;

  if (moving) {
    frame = requestAnimationFrame(animate);
  } else {
    Object.assign(camera, target);
    render();
    frame = undefined;
    lastFrameTime = undefined;
  }
}

function moveCamera() {
  if (frame === undefined) {
    lastFrameTime = undefined;
    frame = requestAnimationFrame(animate);
  }
}

function showWholeDrawing() {
  isOverview = true;
  awaitingFirstKey = true;
  previousKeyPosition = null;
  lastKeyDirection = null;
  startNewStroke = true;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }

  target.x = (minX + maxX) / 2;
  target.y = (minY + maxY) / 2;
  target.scale = Math.min(
    1.05,
    (width * 0.76) / Math.max(180, maxX - minX + 70),
    (height * 0.76) / Math.max(180, maxY - minY + 70),
  );
  moveCamera();
}

window.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;

  if (event.code === 'Space' || event.code === 'Enter') {
    event.preventDefault();
    awaitingFirstKey = true;
    previousKeyPosition = null;
    lastKeyDirection = null;
    startNewStroke = true;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showWholeDrawing, 10_000);
    return;
  }

  const position = keyPositions.get(event.code);
  const arrow = arrowDirections[event.code];
  if (!position && !arrow) return;

  event.preventDefault();

  let direction = null;
  if (awaitingFirstKey) {
    // The first key after opening, a pause, or a pen lift only sets a reference.
    awaitingFirstKey = false;
    previousKeyPosition = null;
    lastKeyDirection = null;
  } else if (arrow) {
    direction = arrow;
    previousKeyPosition = null;
    lastKeyDirection = null;
  } else if (previousKeyPosition) {
    const dx = position.x - previousKeyPosition.x;
    const dy = position.y - previousKeyPosition.y;
    const distance = Math.hypot(dx, dy);

    // Only the direction comes from the keyboard. Each stroke starts at the
    // current drawing point, so a distant key does not jump to a fixed place.
    if (distance > 0) {
      direction = { x: dx / distance, y: dy / distance };
      lastKeyDirection = direction;
    } else {
      direction = lastKeyDirection;
    }
  } else {
    lastKeyDirection = null;
  }
  if (position) previousKeyPosition = position;

  const previous = points[points.length - 1];
  const next = direction ? {
    x: previous.x + direction.x * stepLength,
    y: previous.y + direction.y * stepLength,
  } : previous;
  if (direction) {
    if (startNewStroke) {
      strokeStarts.add(points.length);
      startNewStroke = false;
    }
    points.push(next);
  }

  isOverview = false;
  target.x = next.x;
  target.y = next.y;
  target.scale = 1.65;
  moveCamera();

  clearTimeout(idleTimer);
  idleTimer = setTimeout(showWholeDrawing, 10_000);
});

window.addEventListener('resize', () => {
  resize();
  if (isOverview) showWholeDrawing();
});

resize();
