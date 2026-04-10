/**
 * PDA Interactive Simulator — pda.js
 * MINON-inspired: canvas state diagram, animated tape + stack
 */

/* ── PRESETS ──────────────────────────────── */
const PRESETS = {
  anbn: {
    name: 'aⁿbⁿ',
    desc: 'Equal number of a\'s followed by b\'s',
    states: ['q0','q1','q2'],
    startState: 'q0',
    acceptStates: ['q2'],
    initialStack: ['Z'],
    transitions: [
      { from:'q0', input:'a', stackTop:'Z', to:'q1', push:['A','Z'], label:'a,Z/AZ' },
      { from:'q1', input:'a', stackTop:'A', to:'q1', push:['A','A'], label:'a,A/AA' },
      { from:'q1', input:'b', stackTop:'A', to:'q1', push:[],        label:'b,A/ε'  },
      { from:'q1', input:'',  stackTop:'Z', to:'q2', push:['Z'],     label:'ε,Z/Z'  },
    ],
    examples: ['ab','aabb','aaabbb']
  },
  palindrome: {
    name: 'ww^R',
    desc: 'Even-length palindromes over {a,b}',
    states: ['q0','q1','q2'],
    startState: 'q0',
    acceptStates: ['q2'],
    initialStack: ['Z'],
    transitions: [
      { from:'q0', input:'a', stackTop:'Z', to:'q0', push:['A','Z'], label:'a,Z/AZ' },
      { from:'q0', input:'b', stackTop:'Z', to:'q0', push:['B','Z'], label:'b,Z/BZ' },
      { from:'q0', input:'a', stackTop:'A', to:'q0', push:['A','A'], label:'a,A/AA' },
      { from:'q0', input:'a', stackTop:'B', to:'q0', push:['A','B'], label:'a,B/AB' },
      { from:'q0', input:'b', stackTop:'A', to:'q0', push:['B','A'], label:'b,A/BA' },
      { from:'q0', input:'b', stackTop:'B', to:'q0', push:['B','B'], label:'b,B/BB' },
      { from:'q0', input:'a', stackTop:'A', to:'q1', push:[],        label:'a,A/ε (mid)' },
      { from:'q0', input:'b', stackTop:'B', to:'q1', push:[],        label:'b,B/ε (mid)' },
      { from:'q1', input:'a', stackTop:'A', to:'q1', push:[],        label:'a,A/ε' },
      { from:'q1', input:'b', stackTop:'B', to:'q1', push:[],        label:'b,B/ε' },
      { from:'q1', input:'',  stackTop:'Z', to:'q2', push:['Z'],     label:'ε,Z/Z' },
    ],
    examples: ['abba','aabbaa']
  },
  brackets: {
    name: 'Balanced Brackets',
    desc: 'Any mix of balanced ( ) [ ] { }',
    states: ['q0','q1'],
    startState: 'q0',
    acceptStates: ['q1'],
    initialStack: ['Z'],
    transitions: [
      { from:'q0', input:'(', stackTop:'Z', to:'q0', push:['(','Z'], label:'(,Z/(Z' },
      { from:'q0', input:'(', stackTop:'(', to:'q0', push:['(','('], label:'(,(/((' },
      { from:'q0', input:'(', stackTop:'[', to:'q0', push:['(','['], label:'(,[/([' },
      { from:'q0', input:'(', stackTop:'{', to:'q0', push:['(','{'], label:'(,{/({' },
      { from:'q0', input:'[', stackTop:'Z', to:'q0', push:['[','Z'], label:'[,Z/[Z' },
      { from:'q0', input:'[', stackTop:'(', to:'q0', push:['[','('], label:'[,(/ [(' },
      { from:'q0', input:'[', stackTop:'[', to:'q0', push:['[','['], label:'[,[/[[' },
      { from:'q0', input:'[', stackTop:'{', to:'q0', push:['[','{'], label:'[,{/[{' },
      { from:'q0', input:'{', stackTop:'Z', to:'q0', push:['{','Z'], label:'{,Z/{Z' },
      { from:'q0', input:'{', stackTop:'(', to:'q0', push:['{','('], label:'{,(/{(' },
      { from:'q0', input:'{', stackTop:'[', to:'q0', push:['{','['], label:'{,[/{[' },
      { from:'q0', input:'{', stackTop:'{', to:'q0', push:['{','{'], label:'{,{/{{' },
      { from:'q0', input:')', stackTop:'(', to:'q0', push:[],        label:'),(/ε' },
      { from:'q0', input:']', stackTop:'[', to:'q0', push:[],        label:'],[/ε' },
      { from:'q0', input:'}', stackTop:'{', to:'q0', push:[],        label:'},{/ε' },
      { from:'q0', input:'',  stackTop:'Z', to:'q1', push:['Z'],     label:'ε,Z/Z' },
    ],
    examples: ['()','([]{})','((()))']
  },
  anbncn: {
    name: 'aⁿbⁿcⁿ (not CFL)',
    desc: 'Cannot be recognized by any PDA',
    states: ['q0'],
    startState: 'q0',
    acceptStates: [],
    initialStack: ['Z'],
    transitions: [],
    examples: []
  }
};

/* ── STATE ────────────────────────────────── */
let currentKey  = 'anbn';
let simState    = null;
let autoTimer   = null;
let activeRow   = -1;
let logCount    = 0;
let canvas, ctx;

/* ── CANVAS DIAGRAM ───────────────────────── */
const NODE_R   = 26;
const COLORS   = {
  bg:       '#0d0d0d',
  node:     '#1e1e1e',
  border:   'rgba(255,255,255,0.12)',
  active:   '#00ff88',
  accept:   '#64c8ff',
  edge:     'rgba(255,255,255,0.2)',
  edgeAct:  '#ffcc00',
  text:     '#94a3b8',
  textAct:  '#0d0d0d',
  label:    '#475569',
  labelAct: '#ffcc00',
};

function initCanvas() {
  canvas = document.getElementById('diagram-canvas');
  ctx    = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', () => { resizeCanvas(); drawDiagram(currentPreset(), simState ? simState.state : currentPreset().startState); });
}

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width  = rect.width  || 600;
  canvas.height = 200;
}

function currentPreset() { return PRESETS[currentKey]; }

function drawDiagram(preset, activeState) {
  if (!ctx) return;
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  // BG
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, W, H);

  // scanlines
  ctx.fillStyle = 'rgba(255,255,255,0.015)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 1);
  }

  const n = preset.states.length;
  const spacing = Math.min(160, (W - 80) / Math.max(n - 1, 1));
  const startX  = (W - spacing * (n - 1)) / 2;
  const cy      = H / 2;

  // Compute node positions
  const pos = preset.states.map((s, i) => ({
    x: startX + i * spacing, y: cy, state: s
  }));

  /* Draw edges */
  // group transitions by from→to to stack same-pair labels
  const edgeMap = {};
  preset.transitions.forEach(t => {
    const key = `${t.from}→${t.to}`;
    if (!edgeMap[key]) edgeMap[key] = { from: t.from, to: t.to, labels: [] };
    edgeMap[key].labels.push(t.label);
  });

  Object.values(edgeMap).forEach(e => {
    const fp = pos.find(p => p.state === e.from);
    const tp = pos.find(p => p.state === e.to);
    if (!fp || !tp) return;

    const isActEdge = simState && (
      (simState.lastTrans && simState.lastTrans.from === e.from && simState.lastTrans.to === e.to)
    );
    const col = isActEdge ? COLORS.edgeAct : COLORS.edge;

    if (e.from === e.to) {
      // self-loop
      drawSelfLoop(fp.x, fp.y, col, e.labels, isActEdge);
    } else {
      drawArrow(fp.x, fp.y, tp.x, tp.y, col, e.labels, isActEdge);
    }
  });

  // Start arrow
  const sp = pos[0];
  ctx.strokeStyle = COLORS.edge;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4,4]);
  ctx.beginPath();
  ctx.moveTo(sp.x - NODE_R - 36, cy);
  ctx.lineTo(sp.x - NODE_R, cy);
  ctx.stroke();
  ctx.setLineDash([]);
  drawArrowHead(sp.x - NODE_R, cy, Math.PI, COLORS.edge);

  // Draw nodes
  pos.forEach(p => {
    const isActive = p.state === activeState;
    const isAccept = preset.acceptStates.includes(p.state);
    drawNode(p.x, p.y, p.state, isActive, isAccept);
  });
}

function drawNode(x, y, label, isActive, isAccept) {
  // Glow
  if (isActive) {
    ctx.beginPath();
    ctx.arc(x, y, NODE_R + 8, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(x, y, NODE_R, x, y, NODE_R + 14);
    grad.addColorStop(0, isAccept ? 'rgba(100,200,255,0.35)' : 'rgba(0,255,136,0.35)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Circle fill
  ctx.beginPath();
  ctx.arc(x, y, NODE_R, 0, Math.PI * 2);
  ctx.fillStyle = isActive
    ? (isAccept ? 'rgba(100,200,255,0.25)' : 'rgba(0,255,136,0.2)')
    : COLORS.node;
  ctx.fill();

  // Border
  ctx.lineWidth = isActive ? 2 : 1.5;
  ctx.strokeStyle = isActive
    ? (isAccept ? COLORS.accept : COLORS.active)
    : (isAccept ? 'rgba(100,200,255,0.4)' : COLORS.border);
  ctx.stroke();

  // Inner ring for accept
  if (isAccept) {
    ctx.beginPath();
    ctx.arc(x, y, NODE_R - 5, 0, Math.PI * 2);
    ctx.lineWidth = 1;
    ctx.strokeStyle = isActive ? COLORS.accept : 'rgba(100,200,255,0.25)';
    ctx.stroke();
  }

  // Label
  ctx.fillStyle = isActive ? (isAccept ? COLORS.accept : COLORS.active) : COLORS.text;
  ctx.font = `600 12px 'JetBrains Mono', monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (isActive) {
    ctx.shadowColor = isAccept ? COLORS.accept : COLORS.active;
    ctx.shadowBlur  = 10;
  }
  ctx.fillText(label, x, y);
  ctx.shadowBlur = 0;
}

function drawArrow(x1, y1, x2, y2, col, labels, isAct) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx*dx + dy*dy);
  const ux = dx / dist, uy = dy / dist;
  const sx = x1 + ux * NODE_R, sy = y1 + uy * NODE_R;
  const ex = x2 - ux * NODE_R, ey = y2 - uy * NODE_R;

  // Curve offset
  const mx = (sx+ex)/2 - uy*28, my = (sy+ey)/2 + ux*28;

  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(mx, my, ex, ey);
  ctx.strokeStyle = col;
  ctx.lineWidth = isAct ? 2 : 1.5;
  if (isAct) { ctx.shadowColor = col; ctx.shadowBlur = 8; }
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Arrowhead
  const angle = Math.atan2(ey - my, ex - mx);
  drawArrowHead(ex, ey, angle, col);

  // Label box on midpoint
  const lx = (sx + mx*2 + ex*1)/4 - 2;
  const ly = (sy + my*2 + ey*1)/4 - 2 - 18;
  drawEdgeLabel(lx, ly, labels.join('\n'), isAct);
}

function drawSelfLoop(x, y, col, labels, isAct) {
  const lx = x - 30, ly = y - NODE_R - 48;
  ctx.beginPath();
  ctx.arc(x, y - NODE_R - 20, 20, Math.PI*0.3, Math.PI*2.7);
  ctx.strokeStyle = col;
  ctx.lineWidth = isAct ? 2 : 1.5;
  if (isAct) { ctx.shadowColor = col; ctx.shadowBlur = 6; }
  ctx.stroke();
  ctx.shadowBlur = 0;
  drawArrowHead(x + 14, y - NODE_R - 8, Math.PI/2 + 0.5, col);
  drawEdgeLabel(x, y - NODE_R - 52, labels.join('\n'), isAct);
}

function drawArrowHead(x, y, angle, col) {
  const size = 7;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - Math.cos(angle - 0.45) * size, y - Math.sin(angle - 0.45) * size);
  ctx.lineTo(x - Math.cos(angle + 0.45) * size, y - Math.sin(angle + 0.45) * size);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
}

function drawEdgeLabel(x, y, text, isAct) {
  const lines = text.split('\n');
  const lh = 13, pad = 5;
  const maxW = Math.max(...lines.map(l => ctx.measureText(l).width)) + pad*2;
  const bh = lines.length * lh + pad*2;

  ctx.fillStyle = isAct ? 'rgba(255,204,0,0.12)' : 'rgba(10,10,10,0.75)';
  ctx.strokeStyle = isAct ? 'rgba(255,204,0,0.5)' : 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  roundRect(ctx, x - maxW/2, y - bh/2, maxW, bh, 3);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle  = isAct ? COLORS.labelAct : COLORS.label;
  ctx.font       = `500 10px 'JetBrains Mono', monospace`;
  ctx.textAlign  = 'center';
  ctx.textBaseline = 'middle';
  if (isAct) { ctx.shadowColor = COLORS.labelAct; ctx.shadowBlur = 6; }
  lines.forEach((l, i) => {
    ctx.fillText(l, x, y - (lines.length-1)*lh/2 + i*lh);
  });
  ctx.shadowBlur = 0;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w, y,   x+w, y+r,   r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x,   y+h, x, y+h-r,   r);
  ctx.lineTo(x, y+r); ctx.arcTo(x,   y,   x+r, y,       r);
  ctx.closePath();
}

/* ── TRANSITION TABLE ─────────────────────── */
function renderTable(preset) {
  const tbody = document.getElementById('trans-tbody');
  if (!preset.transitions.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:18px;color:var(--text3)">No transitions — language is not context-free</td></tr>`;
    return;
  }
  tbody.innerHTML = preset.transitions.map((t, i) =>
    `<tr id="tr${i}">
      <td style="color:var(--green)">${t.from}</td>
      <td>${t.input ? t.input : '<span class="badge-eps">ε</span>'}</td>
      <td>${t.stackTop}</td>
      <td style="color:var(--blue)">${t.to}</td>
      <td>${t.push.length ? t.push.join('') : '<span class="badge-eps">ε</span>'}</td>
    </tr>`
  ).join('');
}

function hlRow(i) {
  if (activeRow >= 0) {
    const old = document.getElementById('tr' + activeRow);
    if (old) old.classList.remove('hl');
  }
  activeRow = i;
  if (i >= 0) {
    const row = document.getElementById('tr' + i);
    if (row) { row.classList.add('hl'); row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
}

/* ── TAPE ─────────────────────────────────── */
function renderTape(chars, pos) {
  const d = document.getElementById('tape-display');
  if (!chars.length) {
    d.innerHTML = '<span style="font-size:12px;color:var(--text3);font-family:var(--mono)">// no input loaded</span>';
    return;
  }
  d.innerHTML = chars.map((c, i) => {
    let cls = 'tape-cell';
    if (i === pos)     cls += ' read';
    else if (i < pos)  cls += ' done';
    return `<div class="${cls}">${c}</div>`;
  }).join('') + `<div class="tape-end" title="end of input">⊣</div>`;
}

/* ── STACK ────────────────────────────────── */
function renderStack(stack) {
  const d = document.getElementById('stack-body');
  if (!stack.length) {
    d.innerHTML = '<div class="stack-empty">[ EMPTY ]</div>';
    return;
  }
  d.innerHTML = stack.slice().reverse().map((s, i) => {
    let cls = 'stack-chip';
    if (s === 'Z') cls += ' bot';
    return `<div class="${cls}">${s}</div>`;
  }).join('');
}

/* ── LOG ──────────────────────────────────── */
function addLog(msg, type = 'step') {
  const d = document.getElementById('trans-log');
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  logCount++;
  entry.innerHTML = `<span class="log-num">${String(logCount).padStart(2,'0')}</span><span>${msg}</span>`;
  d.prepend(entry);
}

/* ── METRICS ──────────────────────────────── */
function setMetric(id, val) {
  const card = document.getElementById('mc-' + id);
  const el   = document.getElementById('m-'  + id);
  if (el.textContent === String(val)) return;
  el.textContent = val;
  card.classList.remove('flash');
  void card.offsetWidth;
  card.classList.add('flash');
}

function setStatus(type, text) {
  const el = document.getElementById('sim-status');
  el.className = 'sim-status ' + type;
  el.textContent = text;
}

/* ── LOAD PRESET ──────────────────────────── */
function loadPreset(key) {
  currentKey = key;
  const p = PRESETS[key];
  renderTable(p);
  if (ctx) drawDiagram(p, p.startState);
  resetSim();
  document.getElementById('input-string').value =
    key === 'anbncn' ? 'aabbcc' : (p.examples[Math.floor(p.examples.length / 2)] || '');
  // Update preset description
  const descEl = document.getElementById('preset-desc');
  if (descEl) descEl.textContent = p.desc;
}

/* ── SIMULATION ───────────────────────────── */
function startSim() {
  const p     = currentPreset();
  const input = document.getElementById('input-string').value.trim();
  if (!p.transitions.length) {
    addLog('⚠ No transitions — this language is not context-free. PDA cannot simulate it.', 'info');
    setStatus('reject', '✗ Not a CFL');
    return;
  }
  simState = {
    p, input: input.split(''), pos: 0,
    state: p.startState, stack: [...p.initialStack],
    steps: 0, done: false, accepted: false, lastTrans: null
  };
  logCount = 0;
  document.getElementById('trans-log').innerHTML = '';
  hlRow(-1);
  updateDisplay();
  document.getElementById('step-btn').disabled = false;
  document.getElementById('play-btn').disabled = false;
  setStatus('running', '● Running');
  addLog(`▶ START  input="${input}"  state=${p.startState}  stack=[${p.initialStack.join('')}]`, 'info');
}

function findTrans(p, state, ch, top) {
  for (let i = 0; i < p.transitions.length; i++) {
    const t = p.transitions[i];
    if (t.from === state && t.input === ch && t.stackTop === top)
      return { t, i, consumed: true };
  }
  for (let i = 0; i < p.transitions.length; i++) {
    const t = p.transitions[i];
    if (t.from === state && t.input === '' && t.stackTop === top)
      return { t, i, consumed: false };
  }
  return null;
}

function stepSim() {
  if (!simState || simState.done) return;
  const { p, input } = simState;
  const top = simState.stack[simState.stack.length - 1];
  const ch  = input[simState.pos] || '';
  const res = findTrans(p, simState.state, ch, top);
  if (!res) {
    if (simState.pos >= input.length && p.acceptStates.includes(simState.state)) {
      finishSim(true);
    } else {
      const ep = findTrans(p, simState.state, '', top);
      ep ? applyTrans(ep) : finishSim(false);
    }
    return;
  }
  applyTrans(res);
}

function applyTrans({ t, i, consumed }) {
  simState.stack.pop();
  [...t.push].reverse().forEach(s => simState.stack.push(s));
  const old = simState.state;
  simState.state = t.to;
  simState.steps++;
  simState.lastTrans = t;
  if (consumed) simState.pos++;
  hlRow(i);
  addLog(`(${old}, ${t.input || 'ε'}, ${t.stackTop}) → (${t.to}, ${t.push.length ? t.push.join('') : 'ε'})   stack:[${simState.stack.join('')}]`, 'step');
  updateDisplay();
  // Check for finish after input consumed
  if (simState.pos >= simState.input.length) {
    const top2 = simState.stack[simState.stack.length - 1];
    if (!findTrans(simState.p, simState.state, '', top2))
      setTimeout(() => { if (simState && !simState.done) finishSim(simState.p.acceptStates.includes(simState.state)); }, 140);
  }
}

function finishSim(accepted) {
  simState.done = true;
  stopAuto();
  document.getElementById('step-btn').disabled = true;
  document.getElementById('play-btn').disabled = true;
  const msg = accepted
    ? `✓ ACCEPTED — ${simState.steps} steps`
    : `✗ REJECTED — ${simState.steps} steps`;
  addLog(msg, accepted ? 'accept' : 'reject');
  setStatus(accepted ? 'accept' : 'reject', accepted ? '✓ Accepted' : '✗ Rejected');
  updateDisplay();
  if (accepted) celebrate();
}

function resetSim() {
  simState = null; logCount = 0;
  stopAuto(); hlRow(-1);
  document.getElementById('step-btn').disabled = true;
  document.getElementById('play-btn').disabled = true;
  document.getElementById('trans-log').innerHTML = '';
  setStatus('ready', '○ Ready');
  setMetric('state', '—'); setMetric('steps', 0); setMetric('depth', 0);
  renderTape([], -1); renderStack([]);
  const p = currentPreset();
  if (ctx) drawDiagram(p, p.startState);
}

function toggleAuto() {
  if (autoTimer) { stopAuto(); return; }
  const playBtn = document.getElementById('play-btn');
  playBtn.textContent = '⏸ Pause';
  const speed = 1600 - parseInt(document.getElementById('step-speed').value);
  autoTimer = setInterval(() => {
    if (!simState || simState.done) { stopAuto(); return; }
    stepSim();
  }, Math.max(speed, 80));
}
function stopAuto() {
  if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
  document.getElementById('play-btn').textContent = '▶ Auto';
}

function updateDisplay() {
  if (!simState) return;
  renderTape(simState.input, simState.pos);
  renderStack(simState.stack);
  if (ctx) drawDiagram(simState.p, simState.state);
  setMetric('state', simState.state);
  setMetric('steps', simState.steps);
  setMetric('depth', simState.stack.length);
}

/* ── CELEBRATE ────────────────────────────── */
function celebrate() {
  const colours = ['#00ff88','#ffcc00','#64c8ff','#c084fc','#fb923c'];
  for (let i = 0; i < 40; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.cssText = `left:${15+Math.random()*70}vw;top:${Math.random()*35}vh;` +
        `background:${colours[Math.floor(Math.random()*colours.length)]};` +
        `transform:rotateZ(${Math.random()*360}deg);` +
        `animation-duration:${0.9+Math.random()*0.8}s;` +
        `animation-delay:${Math.random()*0.4}s;` +
        `width:${6+Math.random()*8}px;height:${6+Math.random()*8}px;` +
        `border-radius:${Math.random()>0.5?'50%':'2px'};`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1800);
    }, i * 35);
  }
}

/* ── TABS ─────────────────────────────────── */
function switchTab(tab) {
  ['simulate','learn','examples'].forEach(id => {
    document.getElementById('tab-' + id).style.display = id === tab ? '' : 'none';
  });
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tab);
  });
}

/* ── EXAMPLES ─────────────────────────────── */
function runExample(preset, input) {
  document.getElementById('preset-select').value = preset;
  loadPreset(preset);
  document.getElementById('input-string').value = input;
  switchTab('simulate');
  setTimeout(() => { startSim(); setTimeout(toggleAuto, 300); }, 100);
}

/* ── INIT ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initCanvas();
  loadPreset('anbn');
});
