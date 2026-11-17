// Shell: game loop, HUD, overlays, pause, best score, screenshot staging.
import { CFG } from './config.js';
import { PHASE, newState, startGame, applyUpgrade, step } from './world.js';
import { render } from './render.js';
import { createInput, autopilot } from './input.js';
import { applyShot, driftTitle } from './shots.js';
import { ensureAudio, startPad, toggleMute } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const state = newState(7);
state.best = Number(localStorage.getItem('void-surge-best') || 0);

const $ = (id) => document.getElementById(id);
const overlays = {
  title: $('ov-title'), upgrade: $('ov-upgrade'), victory: $('ov-victory'),
  defeat: $('ov-defeat'), pause: $('ov-pause'),
};

function show(name) {
  for (const [k, el] of Object.entries(overlays)) el.classList.toggle('show', k === name);
}

function syncHud() {
  const p = state.player;
  $('hullfill').style.width = `${Math.max(0, (p.hull / p.maxHull) * 100)}%`;
  $('hulltxt').textContent = Math.ceil(p.hull);
  $('hud-wave').textContent = `${Math.max(state.wave, state.phase === PHASE.TITLE ? 0 : state.wave)}/${CFG.WAVES}`;
  $('hud-score').textContent = state.score.toLocaleString();
  $('hud-left').textContent = state.enemies.length + state.spawnQueue.length;
  $('hud-weapon').textContent = `Blaster Lv${p.shots}${p.damage > CFG.PLAYER.bulletDamage ? ' · +' + Math.round((p.damage / CFG.PLAYER.bulletDamage - 1) * 100) + '% dmg' : ''}`;
  $('hud-best').textContent = state.best > 0 ? state.best.toLocaleString() : '—';
}

function syncUpgradeCards() {
  const box = $('cards');
  box.innerHTML = '';
  $('upg-sub').textContent = `Wave ${state.wave} cleared — choose an upgrade (score ${state.score.toLocaleString()})`;
  state.upgradeChoices.forEach((u, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3>${u.name}</h3><p>${u.desc}</p><span class="key">Press ${i + 1}</span>`;
    card.addEventListener('click', () => chooseUpgrade(u.id));
    box.appendChild(card);
  });
}

function chooseUpgrade(id) {
  if (state.phase !== PHASE.UPGRADE) return;
  applyUpgrade(state, id);
  afterPhaseChange();
}

function afterPhaseChange() {
  if (state.phase === PHASE.PLAY) { show(null); }
  else if (state.phase === PHASE.UPGRADE) { syncUpgradeCards(); show('upgrade'); }
  else if (state.phase === PHASE.VICTORY) {
    saveBest();
    $('vic-line').textContent = `The rift is sealed. You survived all ${CFG.WAVES} waves.`;
    $('vic-stats').textContent = `Score ${state.score.toLocaleString()} · ${state.kills} hostiles destroyed · best ${state.best.toLocaleString()}`;
    show('victory');
  } else if (state.phase === PHASE.DEFEAT) {
    saveBest();
    $('def-line').textContent = `The swarm overran your ship on wave ${state.wave}.`;
    $('def-stats').textContent = `Score ${state.score.toLocaleString()} · reached wave ${state.wave}/${CFG.WAVES} · ${state.kills} destroyed`;
    show('defeat');
  }
}

function saveBest() {
  if (state.score > state.best) {
    state.best = state.score;
    try { localStorage.setItem('void-surge-best', String(state.best)); } catch { /* private mode */ }
  }
}

function launch() {
  ensureAudio();
  startPad();
  startGame(state, 7);
  show(null);
}

$('btn-start').addEventListener('click', launch);
$('btn-again-v').addEventListener('click', launch);
$('btn-again-d').addEventListener('click', launch);
$('btn-resume').addEventListener('click', () => {
  state.phase = state.prevPhase;
  show(null);
});

input.onKey = (code) => {
  if (code === 'KeyM') { const m = toggleMute(); document.querySelector('.sub').textContent = m ? 'muted — press M to unmute' : 'arena survival shooter · 10 waves · hold the line'; }
  if (code === 'KeyP') {
    if (state.phase === PHASE.PLAY) { state.prevPhase = PHASE.PLAY; state.phase = PHASE.PAUSE; show('pause'); }
    else if (state.phase === PHASE.PAUSE) { state.phase = state.prevPhase; show(null); }
  }
  if (code === 'KeyR' && state.phase !== PHASE.TITLE) launch();
  if (state.phase === PHASE.UPGRADE) {
    const idx = ['Digit1', 'Digit2', 'Digit3'].indexOf(code);
    if (idx >= 0 && state.upgradeChoices[idx]) chooseUpgrade(state.upgradeChoices[idx].id);
  }
  if (code === 'Enter' && state.phase === PHASE.TITLE) launch();
};

// Screenshot staging: ?shot=title|play|victory|defeat runs the real game fast.
const shot = new URLSearchParams(location.search).get('shot');
let staged = false;
if (shot) {
  try {
    applyShot(state, input, shot);
    staged = true;
    if (state.phase === PHASE.VICTORY) afterPhaseChange();
    else if (state.phase === PHASE.DEFEAT) afterPhaseChange();
    else if (state.phase === PHASE.UPGRADE) { syncUpgradeCards(); show('upgrade'); }
    else show(null);
  } catch (err) {
    console.error('shot staging failed', err);
  }
}

let last = performance.now();
let prevPhase = state.phase;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!staged) {
    if (state.phase === PHASE.TITLE) driftTitle(state, dt);
    else if (state.phase === PHASE.PLAY) step(state, input, dt);
  } else if (state.phase === PHASE.PLAY) {
    // Keep a staged play scene alive: the autopilot keeps fighting.
    autopilot(state, input);
    step(state, input, dt);
  }
  if (state.phase !== prevPhase) { afterPhaseChange(); prevPhase = state.phase; }
  render(ctx, state);
  syncHud();
  requestAnimationFrame(frame);
}
syncHud();
requestAnimationFrame(frame);
