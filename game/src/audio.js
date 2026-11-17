// Synthesized sound effects with WebAudio — no audio files needed.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

export function toggleMute() { muted = !muted; return muted; }
export function isMuted() { return muted; }

function tone(freq, dur, type, vol, slideTo) {
  if (!ctx || muted) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export function sfxLaser() { tone(880, 0.09, 'square', 0.05, 320); }
export function sfxHit() { tone(220, 0.07, 'triangle', 0.07, 120); }
export function sfxBoom() { tone(160, 0.35, 'sawtooth', 0.12, 40); }
export function sfxPickup() { tone(660, 0.12, 'sine', 0.09, 990); }
export function sfxHurt() { tone(110, 0.25, 'sawtooth', 0.12, 55); }
export function sfxWave() { tone(440, 0.18, 'sine', 0.08, 660); tone(660, 0.22, 'sine', 0.07, 880); }
export function sfxUpgrade() { tone(523, 0.12, 'sine', 0.08); setTimeout(() => tone(784, 0.18, 'sine', 0.08), 90); }
export function sfxBoss() { tone(98, 0.6, 'sawtooth', 0.1, 49); }

// A quiet ambient pad: two detuned sines through a low gain, started once.
let padOn = false;
export function startPad() {
  if (!ctx || padOn) return;
  padOn = true;
  const g = ctx.createGain();
  g.gain.value = 0.018;
  g.connect(ctx.destination);
  for (const f of [55, 55.7, 110.3]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(g);
    o.start();
  }
}
