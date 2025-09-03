// app.js
// ====================== Config & State ======================
let G = null;                                // Graph
let startId = null, goalId = null;           // Selected nodes
let currentPath = [];                        // Current shortest path

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = window.devicePixelRatio || 1;

let scale = 1;                               // Zoom
let offsetX = 0, offsetY = 0;                // Pan
const MIN_SCALE = 0.4, MAX_SCALE = 4;

const USE_MOCK = false;                      // Load data source

// World <-> Screen conversions
const w2s = (x, y) => ({ x: x * scale + offsetX, y: y * scale + offsetY });
const s2w = (sx, sy) => ({ x: (sx - offsetX) / scale, y: (sy - offsetY) / scale });

// ====================== Init & Resize ======================
window.addEventListener('load', () => { resize(); init(); });
window.addEventListener('resize', resize);

async function init() {
  if (USE_MOCK) {
    G = new Graph(mockGraph());
  } else {
    const res = await fetch('http://localhost:5173/api/graph');
    const data = await res.json();
    G = new Graph(data);
  }
  fitToView();
  draw();
}

function resize() {
  const rect = canvas.getBoundingClientRect();
  W = Math.floor(rect.width || 800);
  H = Math.floor(rect.height || 480);
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawSafe();
}

function fitToView() {
  if (!G || G.nodes.size === 0) return;

  let xmin = Infinity, ymin = Infinity, xmax = -Infinity, ymax = -Infinity;
  for (const n of G.nodes.values()) {
    xmin = Math.min(xmin, n.x);
    ymin = Math.min(ymin, n.y);
    xmax = Math.max(xmax, n.x);
    ymax = Math.max(ymax, n.y);
  }

  const pad = 30;
  const gw = Math.max(1, xmax - xmin);
  const gh = Math.max(1, ymax - ymin);
  const sx = (W - 2 * pad) / gw;
  const sy = (H - 2 * pad) / gh;

  scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(sx, sy)));

  // Center graph
  const cxWorld = (xmin + xmax) / 2;
  const cyWorld = (ymin + ymax) / 2;
  const center = w2s(cxWorld, cyWorld);
  offsetX += (W / 2 - center.x);
  offsetY += (H / 2 - center.y);
}

function drawSafe() {
  if (!G) { ctx.clearRect(0, 0, W, H); return; }
  draw();
}

// ====================== Rendering ======================
function draw() {
  ctx.clearRect(0, 0, W, H);

  // 1) Edges (base)
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#60a5fa';
  for (const [from, list] of G.adj) {
    for (const { to } of list) {
      if (from > to) continue; // draw once for undirected
      const A = G.nodes.get(from), B = G.nodes.get(to);
      const a = w2s(A.x, A.y), b = w2s(B.x, B.y);
      line(a.x, a.y, b.x, b.y, ctx.strokeStyle, 2);
    }
  }

  // 2) Path (gradient + glow + arrows)
  if (currentPath.length > 1) {
    for (let i = 1; i < currentPath.length; i++) {
      const a = G.nodes.get(currentPath[i - 1]);
      const b = G.nodes.get(currentPath[i]);
      const A = w2s(a.x, a.y), B = w2s(b.x, b.y);

      const grad = ctx.createLinearGradient(A.x, A.y, B.x, B.y);
      grad.addColorStop(0, '#fbbf24'); // amber-400
      grad.addColorStop(1, '#ef4444'); // red-500

      glowStroke(() => {
        line(A.x, A.y, B.x, B.y, grad, 5);
        ctx.strokeStyle = '#fbbf24';
        arrow(A.x, A.y, B.x, B.y, 9);
      }, 14, 'rgba(239,68,68,0.6)');
    }
  }

  // 2.5) Step badges (1..n) trên đường đi
  if (currentPath.length > 0) {
    for (let i = 0; i < currentPath.length; i++) {
      const n = G.nodes.get(currentPath[i]);
      const p = w2s(n.x, n.y);
      const isStart = i === 0;
      const isGoal  = i === currentPath.length - 1;
      const fill   = isStart ? '#065f46' : isGoal ? '#7f1d1d' : '#0b1322';
      const stroke = isStart ? '#34d399' : isGoal ? '#fca5a5' : '#93c5fd';
      stepBadge(p.x - 14, p.y - 22, i + 1, fill, stroke);
    }
  }

  // 3) Nodes (halo for A/B + pill labels)
  for (const n of G.nodes.values()) {
    const p = w2s(n.x, n.y);
    const isA = n.id === startId, isB = n.id === goalId;
    const color = isA ? '#22c55e' : isB ? '#ef4444' : '#22d3ee';

    if (isA || isB) { ctx.save(); ctx.globalAlpha = 0.35; circle(p.x, p.y, 14, color); ctx.restore(); }
    circle(p.x, p.y, (isA || isB) ? 8 : 6, color);
    pillLabel(p.x + 10, p.y - 18, n.label || n.id);
  }
}

// ====================== Interaction ======================
// Pick A/B
canvas.addEventListener('click', (ev) => {
  if (!G) return;
  const r = canvas.getBoundingClientRect();
  const x = ev.clientX - r.left;
  const y = ev.clientY - r.top;
  const pick = pickNodeScreen(x, y, 16);
  if (!pick) return;

  if (!startId) startId = pick.id;
  else if (!goalId && pick.id !== startId) goalId = pick.id;
  else { startId = pick.id; goalId = null; currentPath = []; }

  compute(); draw();
});

// Pan
let dragging = false, lastX = 0, lastY = 0;
canvas.addEventListener('mousedown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; });
window.addEventListener('mouseup', () => { dragging = false; });
window.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  offsetX += e.clientX - lastX;
  offsetY += e.clientY - lastY;
  lastX = e.clientX;
  lastY = e.clientY;
  draw();
});

// Zoom (around cursor)
canvas.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  if (!G) return;

  const { left, top } = canvas.getBoundingClientRect();
  const mouseX = ev.clientX - left;
  const mouseY = ev.clientY - top;

  const worldBefore = s2w(mouseX, mouseY);
  const factor = ev.deltaY < 0 ? 1.1 : 0.9;
  const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * factor));
  scale = newScale;

  const screenAfter = w2s(worldBefore.x, worldBefore.y);
  offsetX += (mouseX - screenAfter.x);
  offsetY += (mouseY - screenAfter.y);
  draw();
}, { passive: false });

// ====================== Pathfinding & Hints ======================
function compute() {
  if (!G || !startId || !goalId) { currentPath = []; renderRouteInfo(); return; }
  const algo = document.getElementById('algo').value;
  currentPath = (algo === 'astar') ? astar(G, startId, goalId) : dijkstra(G, startId, goalId);
  renderRouteInfo();
}

function pathLength(G, path) {
  let s = 0;
  for (let i = 1; i < path.length; i++) {
    const a = G.nodes.get(path[i - 1]);
    const b = G.nodes.get(path[i]);
    s += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return s;
}

function renderRouteInfo() {
  const sumEl = document.getElementById('routeSummary');
  const listEl = document.getElementById('routeSteps');

  if (!currentPath || currentPath.length < 2) {
    if (sumEl) sumEl.textContent = 'Chọn 2 điểm A và B để tìm đường.';
    if (listEl) listEl.innerHTML = '';
    return;
  }

  const dist = pathLength(G, currentPath);
  if (sumEl) sumEl.textContent = `Tổng chiều dài ~ ${dist.toFixed(1)} m · ${currentPath.length - 1} chặng`;

  if (listEl) {
    const items = [];
    // bước 1: điểm bắt đầu
    const start = G.nodes.get(currentPath[0]);
    items.push(`<li data-step="0"><strong>1.</strong> ${start.label || start.id}</li>`);
    // các chặng kế tiếp
    for (let i = 1; i < currentPath.length; i++) {
      const a = G.nodes.get(currentPath[i - 1]);
      const b = G.nodes.get(currentPath[i]);
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      items.push(`<li data-step="${i}"><strong>${i + 1}.</strong> ${b.label || b.id} · ${d.toFixed(0)} m</li>`);
    }
    listEl.innerHTML = items.join('');

    // click vào bước -> pan tới node đó
    listEl.onclick = (ev) => {
      const li = ev.target.closest('li[data-step]');
      if (!li) return;
      const idx = Number(li.dataset.step);
      const node = G.nodes.get(currentPath[idx]);
      if (!node) return;
      const p = w2s(node.x, node.y);
      offsetX += (W / 2 - p.x);
      offsetY += (H / 2 - p.y);
      draw();
    };
  }
}

// ====================== Picking & Primitives ======================
function pickNodeScreen(sx, sy, r = 16) {
  let best = null, dmin = Infinity;
  for (const n of G.nodes.values()) {
    const p = w2s(n.x, n.y);
    const d = Math.hypot(p.x - sx, p.y - sy);
    if (d < r && d < dmin) { dmin = d; best = n; }
  }
  return best;
}

function line(x1, y1, x2, y2, color, w) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.stroke();
}

function circle(x, y, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function glowStroke(cb, blur = 12, color = 'rgba(245,158,11,0.85)') {
  ctx.save();
  ctx.shadowBlur = blur;
  ctx.shadowColor = color;
  cb();
  ctx.restore();
}

function arrow(x1, y1, x2, y2, size = 8) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(ang - Math.PI / 6), y2 - size * Math.sin(ang - Math.PI / 6));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - size * Math.cos(ang + Math.PI / 6), y2 - size * Math.sin(ang + Math.PI / 6));
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function pillLabel(x, y, text) {
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  ctx.font = '12px system-ui';

  const padX = 6, h = 16, r = 8;
  const w = ctx.measureText(text).width + padX * 2;

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.fill();

  ctx.fillStyle = '#c9d3e6';
  ctx.fillText(text, x + padX, y + h - 4);
}

// Badge số thứ tự trên bản đồ
function stepBadge(x, y, text, fill = '#0b1322', stroke = '#93c5fd') {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = stroke;
  ctx.stroke();

  const prevAlign = ctx.textAlign, prevBase = ctx.textBaseline, prevFill = ctx.fillStyle, prevFont = ctx.font;
  ctx.fillStyle = '#ffffff';
  ctx.font = '11px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(text), x, y + 0.5);
  ctx.textAlign = prevAlign; ctx.textBaseline = prevBase; ctx.fillStyle = prevFill; ctx.font = prevFont;
}

// ====================== Controls (buttons/select) ======================
document.getElementById('algo').addEventListener('change', () => {
  if (startId && goalId) { compute(); draw(); }
});

document.getElementById('btnReset').addEventListener('click', () => {
  startId = null;
  goalId = null;
  currentPath = [];
  renderRouteInfo();
  draw();
});

document.getElementById('btnRandom').addEventListener('click', () => {
  if (!G || G.nodes.size < 2) return;
  const ids = Array.from(G.nodes.keys());
  const a = ids[Math.floor(Math.random() * ids.length)];
  let b = a;
  while (b === a) b = ids[Math.floor(Math.random() * ids.length)];
  startId = a;
  goalId = b;
  compute();
  draw();
});

function renderRouteInfo() {
  const sumEl   = document.getElementById('routeSummary');
  const listEl  = document.getElementById('routeSteps');
  const inline  = document.getElementById('routeInline');

  // Chưa có đường đi
  if (!currentPath || currentPath.length < 2) {
    if (sumEl)   sumEl.textContent = 'Chọn 2 điểm A và B để tìm đường.';
    if (listEl)  listEl.innerHTML  = '';
    if (inline) { inline.style.display = 'none'; inline.innerHTML = ''; }
    return;
  }

  // Tổng chiều dài
  const dist = pathLength(G, currentPath);
  if (sumEl) sumEl.textContent = `Tổng chiều dài ~ ${dist.toFixed(1)} m · ${currentPath.length - 1} chặng`;

  // Danh sách chi tiết (giữ như cũ)
  if (listEl) {
    const items = [];
    const start = G.nodes.get(currentPath[0]);
    items.push(`<li data-step="0"><strong>1.</strong> ${start.label || start.id}</li>`);
    for (let i = 1; i < currentPath.length; i++) {
      const a = G.nodes.get(currentPath[i - 1]);
      const b = G.nodes.get(currentPath[i]);
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      items.push(`<li data-step="${i}"><strong>${i + 1}.</strong> ${b.label || b.id} · ${d.toFixed(0)} m</li>`);
    }
    listEl.innerHTML = items.join('');
    listEl.onclick = (ev) => {
      const li = ev.target.closest('li[data-step]');
      if (!li) return;
      const idx = Number(li.dataset.step);
      panToStep(idx);
    };
  }

  // Lộ trình rút gọn (breadcrumb): ①Tên → ②Tên → …
  if (inline) {
    inline.style.display = 'block';
    const chips = currentPath.map((id, i) => {
      const n = G.nodes.get(id);
      const name = n.label || n.id;
      return `<span class="route-chip" data-step="${i}">${i+1}. ${name}</span>`;
    });
    inline.innerHTML = chips.join('<span class="route-sep">→</span>');

    // click chip để pan
    inline.onclick = (e) => {
      const el = e.target.closest('.route-chip[data-step]');
      if (!el) return;
      const idx = Number(el.dataset.step);
      panToStep(idx);
    };
  }
}

// Pan tới step i và render lại
function panToStep(i){
  const node = G.nodes.get(currentPath[i]);
  if (!node) return;
  const p = w2s(node.x, node.y);
  offsetX += (W/2 - p.x);
  offsetY += (H/2 - p.y);
  draw();
}
