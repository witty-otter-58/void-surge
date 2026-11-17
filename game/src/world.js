// Game state and rules: waves, movement, firing, collisions, pickups, upgrades.
import { CFG } from './config.js';
import { mulberry32 } from './random.js';
import { makeEnemy, spawnPoint, buildWaveQueue, splitOnDeath } from './enemies.js';
import { sfxLaser, sfxHit, sfxBoom, sfxPickup, sfxHurt, sfxWave, sfxUpgrade, sfxBoss } from './audio.js';

export const PHASE = { TITLE: 'title', PLAY: 'play', UPGRADE: 'upgrade', VICTORY: 'victory', DEFEAT: 'defeat', PAUSE: 'pause' };

export function newState(seed = 7) {
  const rng = mulberry32(seed);
  return {
    seed,
    rng,
    phase: PHASE.TITLE,
    prevPhase: PHASE.TITLE,
    time: 0,
    wave: 0,
    score: 0,
    kills: 0,
    shotsFired: 0,
    player: {
      x: CFG.W / 2, y: CFG.H / 2, angle: -Math.PI / 2,
      r: CFG.PLAYER.r,
      hull: CFG.PLAYER.maxHull, maxHull: CFG.PLAYER.maxHull,
      speed: CFG.PLAYER.speed, fireInterval: CFG.PLAYER.fireInterval,
      damage: CFG.PLAYER.bulletDamage, shots: CFG.PLAYER.shots,
      fireCd: 0, invuln: 0, rapid: 0, shield: 0, alive: true,
    },
    enemies: [],
    bullets: [],
    ebullets: [],
    pickups: [],
    particles: [],
    stars: Array.from({ length: 90 }, () => ({ x: rng() * CFG.W, y: rng() * CFG.H, s: 0.5 + rng() * 1.5, tw: rng() * Math.PI * 2 })),
    spawnQueue: [],
    spawnTimer: 0,
    waveActive: false,
    upgradeChoices: [],
    message: '',
    messageT: 0,
    best: 0,
  };
}

export function startGame(state, seed = 7) {
  const fresh = newState(seed);
  Object.assign(state, fresh);
  state.best = fresh.best;
  state.phase = PHASE.PLAY;
  beginWave(state, 1);
}

export function beginWave(state, wave) {
  state.wave = wave;
  state.spawnQueue = buildWaveQueue(wave, state.rng);
  state.spawnTimer = 0.5;
  state.waveActive = true;
  state.message = wave % 5 === 0 ? `WAVE ${wave} — WARDEN INBOUND` : `WAVE ${wave}`;
  state.messageT = 2.2;
  if (wave % 5 === 0) sfxBoss(); else sfxWave();
}

function dropPickup(state, x, y) {
  if (state.rng() > CFG.pickupChance) return;
  const kinds = ['heal', 'rapid', 'shield'];
  state.pickups.push({ kind: kinds[Math.floor(state.rng() * kinds.length)], x, y, life: CFG.pickupLife, bob: state.rng() * 6 });
}

function burst(state, x, y, color, n = 14) {
  for (let i = 0; i < n; i++) {
    const a = state.rng() * Math.PI * 2;
    const sp = 60 + state.rng() * 160;
    state.particles.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.5 + state.rng() * 0.4, color });
  }
}

function killEnemy(state, e) {
  state.kills++;
  state.score += e.score;
  burst(state, e.x, e.y, e.color, e.type === 'warden' ? 40 : 14);
  dropPickup(state, e.x, e.y);
  for (const child of splitOnDeath(e, state.wave)) state.enemies.push(child);
  sfxBoom();
}

export function applyUpgrade(state, id) {
  const p = state.player;
  if (id === 'dmg') p.damage = Math.round(p.damage * 1.3);
  else if (id === 'rate') p.fireInterval *= 0.8;
  else if (id === 'multi') p.shots = Math.min(3, p.shots + 1);
  else if (id === 'hull') { p.maxHull += 30; p.hull = Math.min(p.maxHull, p.hull + 30); }
  else if (id === 'speed') p.speed *= 1.15;
  sfxUpgrade();
  state.phase = PHASE.PLAY;
  if (state.wave >= CFG.WAVES) {
    state.phase = PHASE.VICTORY;
    return;
  }
  beginWave(state, state.wave + 1);
}

function offerUpgrades(state) {
  const pool = [...CFG.UPGRADES];
  if (state.player.shots >= 3) { const i = pool.findIndex((u) => u.id === 'multi'); if (i >= 0) pool.splice(i, 1); }
  const choices = [];
  while (choices.length < 3 && pool.length) {
    choices.push(pool.splice(Math.floor(state.rng() * pool.length), 1)[0]);
  }
  state.upgradeChoices = choices;
  state.phase = PHASE.UPGRADE;
  state.score += 100 * state.wave; // wave-clear bonus
}

function hurtPlayer(state, dmg) {
  const p = state.player;
  if (p.invuln > 0 || p.shield > 0 || !p.alive) return;
  p.hull -= dmg;
  p.invuln = 0.9;
  sfxHurt();
  burst(state, p.x, p.y, '#ff5d5d', 10);
  if (p.hull <= 0) {
    p.hull = 0;
    p.alive = false;
    burst(state, p.x, p.y, '#39e6ff', 50);
    sfxBoom();
    state.phase = PHASE.DEFEAT;
  }
}

export function step(state, input, dt) {
  if (state.phase !== PHASE.PLAY) return;
  state.time += dt;
  const p = state.player;
  if (state.messageT > 0) state.messageT -= dt;

  // Movement.
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  if (mx || my) {
    const len = Math.hypot(mx, my);
    p.x += (mx / len) * p.speed * dt;
    p.y += (my / len) * p.speed * dt;
    p.x = Math.max(p.r, Math.min(CFG.W - p.r, p.x));
    p.y = Math.max(p.r, Math.min(CFG.H - p.r, p.y));
  }
  p.angle = Math.atan2(input.aimY - p.y, input.aimX - p.x);
  if (p.invuln > 0) p.invuln -= dt;
  if (p.rapid > 0) p.rapid -= dt;
  if (p.shield > 0) p.shield -= dt;

  // Firing.
  p.fireCd -= dt;
  const interval = p.rapid > 0 ? p.fireInterval * 0.55 : p.fireInterval;
  if (input.fire && p.fireCd <= 0 && p.alive) {
    p.fireCd = interval;
    state.shotsFired++;
    const n = p.shots;
    for (let i = 0; i < n; i++) {
      const spread = (i - (n - 1) / 2) * 0.16;
      const a = p.angle + spread;
      state.bullets.push({
        x: p.x + Math.cos(a) * (p.r + 6), y: p.y + Math.sin(a) * (p.r + 6),
        vx: Math.cos(a) * CFG.PLAYER.bulletSpeed, vy: Math.sin(a) * CFG.PLAYER.bulletSpeed,
        r: CFG.PLAYER.bulletR, dmg: p.damage,
      });
    }
    sfxLaser();
  }

  // Spawning.
  if (state.spawnQueue.length) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      state.spawnTimer = CFG.spawnInterval;
      const type = state.spawnQueue.shift();
      const pt = spawnPoint(state.rng);
      state.enemies.push(makeEnemy(type, pt.x, pt.y, state.wave));
    }
  }

  // Enemy movement: chase the player, with a wobble for drift.
  for (const e of state.enemies) {
    e.flash = Math.max(0, e.flash - dt);
    const dx = p.x - e.x, dy = p.y - e.y;
    const d = Math.hypot(dx, dy) || 1;
    e.wobble += dt * 2;
    const wob = e.type === 'drone' ? Math.sin(e.wobble) * 0.4 : 0;
    const ax = dx / d + -dy / d * wob * 0.3;
    const ay = dy / d + dx / d * wob * 0.3;
    const al = Math.hypot(ax, ay) || 1;
    e.x += (ax / al) * e.speed * dt;
    e.y += (ay / al) * e.speed * dt;
    if (e.type === 'warden') {
      e.shootCd -= dt;
      if (e.shootCd <= 0 && d < 520) {
        e.shootCd = 2.2;
        state.ebullets.push({ x: e.x, y: e.y, vx: (dx / d) * 200, vy: (dy / d) * 200, r: 6, dmg: 12 });
      }
    }
  }

  // Bullets vs enemies.
  for (const b of state.bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  state.bullets = state.bullets.filter((b) => b.x > -20 && b.x < CFG.W + 20 && b.y > -20 && b.y < CFG.H + 20);
  for (const b of state.bullets) {
    for (const e of state.enemies) {
      if (e.hp > 0 && Math.hypot(b.x - e.x, b.y - e.y) < b.r + e.r) {
        e.hp -= b.dmg;
        e.flash = 0.12;
        b.x = -9999;
        sfxHit();
        if (e.hp <= 0) killEnemy(state, e);
        break;
      }
    }
  }
  state.bullets = state.bullets.filter((b) => b.x !== -9999);
  state.enemies = state.enemies.filter((e) => e.hp > 0);

  // Enemy bullets vs player.
  for (const b of state.ebullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (p.alive && Math.hypot(b.x - p.x, b.y - p.y) < b.r + p.r) {
      hurtPlayer(state, b.dmg);
      b.x = -9999;
    }
  }
  state.ebullets = state.ebullets.filter((b) => b.x !== -9999 && b.x > -20 && b.x < CFG.W + 20 && b.y > -20 && b.y < CFG.H + 20);

  // Touch damage.
  if (p.alive) {
    for (const e of state.enemies) {
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r) {
        hurtPlayer(state, e.dmg);
        // Knock the enemy back so it does not stick.
        const dx = e.x - p.x, dy = e.y - p.y, d = Math.hypot(dx, dy) || 1;
        e.x += (dx / d) * 30;
        e.y += (dy / d) * 30;
        if (state.phase !== PHASE.PLAY) return;
      }
    }
  }

  // Pickups.
  for (const pk of state.pickups) {
    pk.life -= dt;
    if (p.alive && Math.hypot(pk.x - p.x, pk.y - p.y) < 24) {
      if (pk.kind === 'heal') p.hull = Math.min(p.maxHull, p.hull + 25);
      else if (pk.kind === 'rapid') p.rapid = 8;
      else p.shield = 8;
      pk.life = 0;
      sfxPickup();
      state.score += 25;
    }
  }
  state.pickups = state.pickups.filter((pk) => pk.life > 0);

  // Particles.
  for (const pt of state.particles) {
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.life -= dt;
  }
  state.particles = state.particles.filter((pt) => pt.life > 0);

  // Wave cleared?
  if (state.waveActive && !state.spawnQueue.length && !state.enemies.length && p.alive) {
    state.waveActive = false;
    if (state.wave >= CFG.WAVES) {
      state.phase = PHASE.VICTORY;
    } else {
      offerUpgrades(state);
    }
  }
}
