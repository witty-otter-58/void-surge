// Enemy definitions and spawning. Enemies chase the player; wardens also shoot.
import { CFG } from './config.js';
import { pickWeighted } from './random.js';

let nextId = 1;

export function makeEnemy(type, x, y, wave) {
  const base = CFG.ENEMIES[type];
  const hpScale = CFG.enemyHpScale(wave);
  return {
    id: nextId++,
    type,
    x, y,
    vx: 0, vy: 0,
    r: base.r,
    hp: Math.round(base.hp * hpScale),
    maxHp: Math.round(base.hp * hpScale),
    speed: base.speed * (0.9 + Math.random() * 0.2),
    dmg: base.dmg,
    score: base.score,
    color: base.color,
    flash: 0,
    shootCd: 2.5,
    wobble: Math.random() * Math.PI * 2,
  };
}

// Pick a spawn point just outside a random arena edge.
export function spawnPoint(rng) {
  const edge = Math.floor(rng() * 4);
  const m = 30;
  if (edge === 0) return { x: -m, y: rng() * CFG.H };
  if (edge === 1) return { x: CFG.W + m, y: rng() * CFG.H };
  if (edge === 2) return { x: rng() * CFG.W, y: -m };
  return { x: rng() * CFG.W, y: CFG.H + m };
}

// Build the spawn queue for a wave: a shuffled list of types, plus a warden on boss waves.
export function buildWaveQueue(wave, rng) {
  const count = CFG.waveCount(wave);
  const mix = CFG.waveMix(wave);
  const q = [];
  for (let i = 0; i < count; i++) q.push(pickWeighted(rng, mix));
  // Shuffle so the mix is not grouped.
  for (let i = q.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [q[i], q[j]] = [q[j], q[i]];
  }
  if (CFG.bossWave(wave)) q.push('warden');
  return q;
}

export function splitOnDeath(enemy, wave) {
  if (enemy.type !== 'splitter') return [];
  const out = [];
  for (const ang of [-0.6, 0.6]) {
    const d = makeEnemy('drone', enemy.x, enemy.y, wave);
    d.vx = Math.cos(ang) * 120;
    d.vy = Math.sin(ang) * 120;
    out.push(d);
  }
  return out;
}
