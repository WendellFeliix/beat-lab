// ---------- Instrumentos ----------
// Cada função cria o som na hora usando o Web Audio API. Nenhum arquivo de áudio.

const STEPS = 16;
const KEY = 'beatlab-estado';

const TRACKS = [
  { nome: 'Bumbo', play: kick },
  { nome: 'Caixa', play: snare },
  { nome: 'Palma', play: clap },
  { nome: 'Chimbal fechado', play: (t) => hat(t, 0.05) },
  { nome: 'Chimbal aberto', play: (t) => hat(t, 0.28) },
  { nome: 'Tom', play: tom },
];

let ctx, master, noiseBuf;

function initAudio() {
  if (ctx) return true;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return false;

  ctx = new AudioCtx();
  master = ctx.createGain();
  master.gain.value = 0.7;
  const compressor = ctx.createDynamicsCompressor(); // evita estourar quando vários sons tocam juntos
  master.connect(compressor);
  compressor.connect(ctx.destination);

  // 1 segundo de ruído branco, reaproveitado por caixa, palma e chimbais
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noiseBuf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return true;
}

// Volume que começa em "peak" e cai até quase zero em "dur" segundos
function env(gain, t, peak, dur) {
  gain.gain.setValueAtTime(peak, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
}

function noise(t, dur) {
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  src.start(t);
  src.stop(t + dur);
  return src;
}

function kick(t) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.12); // a "pancada" vem da queda rápida de tom
  env(g, t, 1, 0.45);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.5);
}

function snare(t) {
  const n = noise(t, 0.25);
  const hp = ctx.createBiquadFilter();
  const gn = ctx.createGain();
  hp.type = 'highpass';
  hp.frequency.value = 1200;
  env(gn, t, 0.55, 0.2);
  n.connect(hp).connect(gn).connect(master);

  const osc = ctx.createOscillator();
  const go = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 190;
  env(go, t, 0.35, 0.1);
  osc.connect(go).connect(master);
  osc.start(t);
  osc.stop(t + 0.15);
}

function clap(t) {
  const n = noise(t, 0.3);
  const bp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.8;

  // Três batidas rápidas e uma cauda, como várias mãos batendo quase juntas
  g.gain.setValueAtTime(0, t);
  [0, 0.014, 0.028].forEach((d) => {
    g.gain.setValueAtTime(0.7, t + d);
    g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.01);
  });
  g.gain.setValueAtTime(0.7, t + 0.042);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  n.connect(bp).connect(g).connect(master);
}

function hat(t, dur) {
  const n = noise(t, dur + 0.05);
  const hp = ctx.createBiquadFilter();
  const g = ctx.createGain();
  hp.type = 'highpass';
  hp.frequency.value = 7500;
  env(g, t, 0.3, dur);
  n.connect(hp).connect(g).connect(master);
}

function tom(t) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(200, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.18);
  env(g, t, 0.8, 0.4);
  osc.connect(g).connect(master);
  osc.start(t);
  osc.stop(t + 0.45);
}

// ---------- Estado ----------

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

function starterPattern() {
  const p = TRACKS.map(() => Array(STEPS).fill(false));
  const set = (i, steps) => steps.forEach((s) => { p[i][s] = true; });
  set(0, [0, 4, 8, 12]);           // bumbo em todo tempo
  set(1, [4, 12]);                 // caixa no 2 e no 4
  set(3, [0, 2, 4, 8, 10, 12]);    // chimbal fechado
  set(4, [6, 14]);                 // chimbal aberto
  return p;
}

function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    const ok = s && Array.isArray(s.pattern) && s.pattern.length === TRACKS.length &&
      s.pattern.every((row) => Array.isArray(row) && row.length === STEPS);
    if (ok) {
      return {
        pattern: s.pattern.map((row) => row.map(Boolean)),
        muted: TRACKS.map((_, i) => Boolean(s.muted && s.muted[i])),
        bpm: clamp(Number(s.bpm) || 110, 60, 200),
      };
    }
  } catch {}
  return { pattern: starterPattern(), muted: TRACKS.map(() => false), bpm: 110 };
}

const state = loadState();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

// ---------- Montagem da tela ----------

const tracksEl = document.getElementById('tracks');
const ledsEl = document.getElementById('leds');
const bpmInput = document.getElementById('bpm');
const bpmOut = document.getElementById('bpmOut');
const playBtn = document.getElementById('playBtn');
const playText = document.getElementById('playText');
const warn = document.getElementById('warn');

tracksEl.innerHTML = TRACKS.map((tr, i) => `
  <div class="track">
    <div class="track-head">
      <button type="button" class="track-name" data-play="${i}">${tr.nome}</button>
      <button type="button" class="mute" data-mute="${i}" aria-pressed="false" aria-label="Silenciar ${tr.nome}">Mudo</button>
    </div>
    <div class="steps" role="group" aria-label="${tr.nome}">
      ${Array.from({ length: STEPS }, (_, s) =>
        `<button type="button" class="step g${Math.floor(s / 4) % 4}" data-t="${i}" data-s="${s}" aria-pressed="false" aria-label="${tr.nome}, passo ${s + 1}"></button>`
      ).join('')}
    </div>
  </div>`).join('');

ledsEl.innerHTML = '<i></i>'.repeat(STEPS);

const stepEls = TRACKS.map((_, i) => [...tracksEl.querySelectorAll(`[data-t="${i}"]`)]);
const muteEls = [...tracksEl.querySelectorAll('[data-mute]')];
const leds = [...ledsEl.children];

// Atualiza a tela inteira a partir do estado
function refresh() {
  stepEls.forEach((row, i) => row.forEach((btn, s) => {
    btn.setAttribute('aria-pressed', String(state.pattern[i][s]));
  }));
  muteEls.forEach((btn, i) => btn.setAttribute('aria-pressed', String(state.muted[i])));
  bpmInput.value = state.bpm;
  bpmOut.textContent = state.bpm;
}

// ---------- Sequenciador (o relógio da batida) ----------
// O setInterval não é preciso o bastante pra música. Por isso, a cada 25 ms
// ele só "agenda" as notas dos próximos 120 ms, e quem marca a hora exata
// é o relógio do áudio (ctx.currentTime).

let playing = false;
let timer = null;
let nextTime = 0;
let current = 0;
let lastCol = -1;
const queue = []; // passos agendados, esperando a hora de acender na tela

const stepDuration = () => 60 / state.bpm / 4; // cada passo é uma semicolcheia

function scheduleStep(step, time) {
  queue.push({ step, time });
  TRACKS.forEach((tr, i) => {
    if (state.pattern[i][step] && !state.muted[i]) tr.play(time);
  });
}

function scheduler() {
  while (nextTime < ctx.currentTime + 0.12) {
    scheduleStep(current, nextTime);
    nextTime += stepDuration();
    current = (current + 1) % STEPS;
  }
}

function setPlayhead(col) {
  if (lastCol >= 0) {
    stepEls.forEach((row) => row[lastCol].classList.remove('playing'));
    leds[lastCol].classList.remove('lit');
  }
  if (col >= 0) {
    stepEls.forEach((row) => row[col].classList.add('playing'));
    leds[col].classList.add('lit');
  }
  lastCol = col;
}

// Acende a coluna na hora em que o som dela toca
function draw() {
  if (!playing) return;
  while (queue.length && queue[0].time <= ctx.currentTime) {
    setPlayhead(queue.shift().step);
  }
  requestAnimationFrame(draw);
}

function start() {
  if (!initAudio()) { warn.hidden = false; return; }
  ctx.resume();
  playing = true;
  current = 0;
  nextTime = ctx.currentTime + 0.06;
  timer = setInterval(scheduler, 25);
  requestAnimationFrame(draw);
  updatePlayButton();
}

function stop() {
  clearInterval(timer);
  playing = false;
  queue.length = 0;
  setPlayhead(-1);
  updatePlayButton();
}

function updatePlayButton() {
  playBtn.setAttribute('aria-pressed', String(playing));
  playText.textContent = playing ? 'Parar' : 'Tocar';
}

const toggle = () => (playing ? stop() : start());

function preview(i) {
  if (!initAudio()) { warn.hidden = false; return; }
  ctx.resume();
  TRACKS[i].play(ctx.currentTime + 0.01);
}

// ---------- Eventos ----------

tracksEl.addEventListener('click', (e) => {
  const step = e.target.closest('[data-s]');
  const play = e.target.closest('[data-play]');
  const mute = e.target.closest('[data-mute]');

  if (step) {
    const t = Number(step.dataset.t);
    const s = Number(step.dataset.s);
    state.pattern[t][s] = !state.pattern[t][s];
    step.setAttribute('aria-pressed', String(state.pattern[t][s]));
    if (state.pattern[t][s] && !playing) preview(t); // ouve o som ao ligar o passo
    save();
  } else if (play) {
    preview(Number(play.dataset.play));
  } else if (mute) {
    const i = Number(mute.dataset.mute);
    state.muted[i] = !state.muted[i];
    mute.setAttribute('aria-pressed', String(state.muted[i]));
    save();
  }
});

bpmInput.addEventListener('input', () => {
  state.bpm = Number(bpmInput.value);
  bpmOut.textContent = state.bpm;
  save();
});

playBtn.addEventListener('click', toggle);

document.getElementById('clearBtn').addEventListener('click', () => {
  state.pattern = TRACKS.map(() => Array(STEPS).fill(false));
  refresh();
  save();
});

document.getElementById('resetBtn').addEventListener('click', () => {
  state.pattern = starterPattern();
  state.muted = TRACKS.map(() => false);
  state.bpm = 110;
  refresh();
  save();
});

// Barra de espaço toca e para (sem atrapalhar quando o foco está num botão ou controle)
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.target.closest('button, input, select, textarea')) {
    e.preventDefault();
    toggle();
  }
});

// ---------- Início ----------

refresh();
