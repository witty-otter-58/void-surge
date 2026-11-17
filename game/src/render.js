// Canvas drawing: starfield, player ship, enemies, bullets, pickups, HUD text.
import { CFG } from './config.js';
import { PHASE } from './world.js';

function drawShip(ctx, x, y, angle, color, shield) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(16, 0);
  ctx.lineTo(-10, -10);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-10, 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(2, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (shield > 0) {
    ctx.strokeStyle = 'rgba(57,230,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawEnemy(ctx, e) {
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color;
  if (e.type === 'drone') {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + e.wobble * 0.2;
      const px = Math.cos(a) * e.r, py = Math.sin(a) * e.r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  } else if (e.type === 'speeder') {
    ctx.rotate(Math.atan2(0, 1) + e.wobble);
    ctx.beginPath();
    ctx.moveTo(e.r, 0);
    ctx.lineTo(-e.r, -e.r * 0.7);
    ctx.lineTo(-e.r, e.r * 0.7);
    ctx.closePath();
    ctx.fill();
  } else if (e.type === 'tank') {
    ctx.fillRect(-e.r, -e.r, e.r * 2, e.r * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(-e.r * 0.5, -e.r * 0.5, e.r, e.r);
  } else if (e.type === 'splitter') {
    ctx.beginPath();
    ctx.arc(0, 0, e.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-e.r * 0.6, 0);
    ctx.lineTo(e.r * 0.6, 0);
    ctx.stroke();
  } else if (e.type === 'warden') {
    ctx.rotate(e.wobble * 0.3);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 === 0 ? e.r : e.r * 0.6;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // HP bar for tough enemies.
  if (e.maxHp >= 90 && e.hp < e.maxHp) {
    const w = e.r * 2;
    ctx.fillStyle = '#1a1f3d';
    ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w, 4);
    ctx.fillStyle = e.color;
    ctx.fillRect(e.x - w / 2, e.y - e.r - 10, w * (e.hp / e.maxHp), 4);
  }
}

export function render(ctx, state) {
  ctx.fillStyle = CFG.COLORS.bg;
  ctx.fillRect(0, 0, CFG.W, CFG.H);
  // Stars.
  for (const s of state.stars) {
    const a = 0.35 + 0.35 * Math.sin(state.time * 1.5 + s.tw);
    ctx.fillStyle = `rgba(139,147,184,${a.toFixed(2)})`;
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }
  // Faint grid.
  ctx.strokeStyle = CFG.COLORS.grid;
  ctx.lineWidth = 1;
  for (let x = 60; x < CFG.W; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CFG.H); ctx.stroke();
  }
  for (let y = 60; y < CFG.H; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CFG.W, y); ctx.stroke();
  }

  // Pickups.
  for (const pk of state.pickups) {
    const bob = Math.sin(state.time * 3 + pk.bob) * 3;
    const col = pk.kind === 'heal' ? '#3dff8e' : pk.kind === 'rapid' ? '#ffb347' : '#39e6ff';
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(pk.x, pk.y + bob, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#04121a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pk.kind === 'heal' ? '+' : pk.kind === 'rapid' ? 'R' : 'S', pk.x, pk.y + bob + 0.5);
  }

  // Enemies, bullets, player, particles.
  for (const e of state.enemies) drawEnemy(ctx, e);
  ctx.fillStyle = '#ffe66d';
  for (const b of state.bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#ff4fd8';
  for (const b of state.ebullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, pt.life * 2);
    ctx.fillStyle = pt.color;
    ctx.fillRect(pt.x, pt.y, 3, 3);
  }
  ctx.globalAlpha = 1;

  const p = state.player;
  if (p.alive && (state.phase === PHASE.PLAY || state.phase === PHASE.UPGRADE || state.phase === PHASE.PAUSE)) {
    const blink = p.invuln > 0 && Math.floor(state.time * 12) % 2 === 0;
    if (!blink) drawShip(ctx, p.x, p.y, p.angle, '#39e6ff', p.shield);
    // Aim line.
    ctx.strokeStyle = 'rgba(57,230,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.angle) * 34, p.y + Math.sin(p.angle) * 34);
    ctx.stroke();
  }

  // Wave banner.
  if (state.messageT > 0 && state.message) {
    ctx.globalAlpha = Math.min(1, state.messageT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, CFG.W / 2, 60);
    ctx.globalAlpha = 1;
  }
}
