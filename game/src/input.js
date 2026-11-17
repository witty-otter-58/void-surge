// Keyboard + mouse input, shared by the live game and the screenshot autopilot.
export function createInput(canvas) {
  const input = {
    up: false, down: false, left: false, right: false,
    fire: false, aimX: 480, aimY: 200,
  };
  const keys = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };
  window.addEventListener('keydown', (e) => {
    if (keys[e.code] !== undefined) { input[keys[e.code]] = true; e.preventDefault(); }
    if (e.code === 'Space') { input.fire = true; e.preventDefault(); }
    if (input.onKey) input.onKey(e.code);
  });
  window.addEventListener('keyup', (e) => {
    if (keys[e.code] !== undefined) input[keys[e.code]] = false;
    if (e.code === 'Space') input.fire = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    input.aimX = ((e.clientX - r.left) / r.width) * canvas.width;
    input.aimY = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => { if (e.button === 0) input.fire = true; });
  window.addEventListener('mouseup', () => { input.fire = false; });
  return input;
}

// Autopilot: steer toward the nearest pickup, keep distance from the nearest
// enemy, always aim at the closest enemy and hold fire. Used for screenshots.
export function autopilot(state, input) {
  const p = state.player;
  if (!p.alive) { input.fire = false; return; }
  let tx = p.x, ty = p.y;
  let nearest = null, nd = Infinity;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (d < nd) { nd = d; nearest = e; }
  }
  // Prefer a pickup if one is close.
  let pk = null, pd = Infinity;
  for (const k of state.pickups) {
    const d = Math.hypot(k.x - p.x, k.y - p.y);
    if (d < pd) { pd = d; pk = k; }
  }
  if (pk && pd < 200) { tx = pk.x; ty = pk.y; }
  else if (nearest) {
    // Orbit at ~220px: move perpendicular-ish, back off when too close.
    if (nd < 130) { tx = p.x + (p.x - nearest.x); ty = p.y + (p.y - nearest.y); }
    else if (nd > 280) { tx = nearest.x; ty = nearest.y; }
    else { tx = p.x + (-(nearest.y - p.y)); ty = p.y + (nearest.x - p.x); }
  }
  input.left = tx < p.x - 8;
  input.right = tx > p.x + 8;
  input.up = ty < p.y - 8;
  input.down = ty > p.y + 8;
  if (nearest) {
    input.aimX = nearest.x;
    input.aimY = nearest.y;
    input.fire = true;
  } else {
    input.fire = false;
  }
}
