// ?shot=title|play|victory|defeat — stage a real scene for screenshots.
// The autopilot plays by the real rules; nothing is faked, only driven faster.
import { CFG } from './config.js';
import { PHASE, newState, startGame, applyUpgrade, step } from './world.js';
import { autopilot } from './input.js';
import { makeEnemy, spawnPoint } from './enemies.js';

export function applyShot(state, input, shot) {
  const params = new URLSearchParams(location.search);
  const seed = Number(params.get('seed') || 7);
  if (shot === 'title') {
    // Ambient drifters on the title screen.
    Object.assign(state, newState(seed));
    state.phase = PHASE.TITLE;
    for (let i = 0; i < 6; i++) {
      const pt = spawnPoint(state.rng);
      state.enemies.push(makeEnemy(['drone', 'speeder', 'splitter'][i % 3], (pt.x + CFG.W) % CFG.W, Math.abs(pt.y) % CFG.H, 1));
    }
    state.drift = true;
    return;
  }
  if (shot === 'play') {
    startGame(state, seed);
    // Fast-forward to the middle of wave 4 with the autopilot playing.
    runAutopilot(state, input, 4, 60);
    return;
  }
  if (shot === 'victory') {
    startGame(state, seed);
    runAutopilot(state, input, CFG.WAVES, 400);
    return;
  }
  if (shot === 'defeat') {
    startGame(state, seed);
    state.player.hull = 12;
    runAutopilot(state, input, 3, 120, true);
    return;
  }
}

// Drive the autopilot through `waves` waves, at several steps per frame so a
// full game finishes in well under a second of wall time.
function runAutopilot(state, input, waves, maxSeconds, fragile = false) {
  const dt = 1 / 60;
  let guard = 0;
  const maxSteps = maxSeconds * 60;
  while (guard++ < maxSteps) {
    if (state.phase === PHASE.VICTORY || state.phase === PHASE.DEFEAT) break;
    if (state.phase === PHASE.UPGRADE) {
      // Always take the first offered upgrade.
      applyUpgrade(state, state.upgradeChoices[0].id);
      continue;
    }
    if (state.phase !== PHASE.PLAY) break;
    autopilot(state, input);
    step(state, input, dt);
    // In fragile (defeat) mode the autopilot steers into danger by standing still.
    if (fragile) { input.left = input.right = input.up = input.down = false; }
  }
}

// Gentle title-screen drift for ambient enemies.
export function driftTitle(state, dt) {
  if (!state.drift) return;
  for (const e of state.enemies) {
    e.x += 12 * dt;
    e.y += 8 * Math.sin(state.time + e.wobble) * dt;
    if (e.x > CFG.W + 30) e.x = -30;
  }
  state.time += dt;
}
