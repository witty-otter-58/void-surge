// All tuning numbers for Void Surge live here.
export const CFG = {
  W: 960,
  H: 600,
  WAVES: 10,
  PLAYER: {
    r: 13, speed: 265, maxHull: 100, fireInterval: 0.16, bulletSpeed: 560,
    bulletDamage: 10, bulletR: 4, shots: 1,
  },
  ENEMIES: {
    drone:    { hp: 20,  speed: 95,  r: 11, dmg: 10, score: 50,  color: '#ff5d5d' },
    speeder:  { hp: 12,  speed: 175, r: 8,  dmg: 8,  score: 80,  color: '#ffb347' },
    tank:     { hp: 95,  speed: 52,  r: 19, dmg: 20, score: 150, color: '#c77dff' },
    splitter: { hp: 32,  speed: 85,  r: 13, dmg: 12, score: 120, color: '#39e6ff' },
    warden:   { hp: 620, speed: 46,  r: 31, dmg: 30, score: 1000, color: '#ff4fd8' },
  },
  // Wave composition: count grows, mix shifts toward tougher types.
  waveCount: (w) => 6 + w * 3,
  waveMix: (w) => {
    const m = [{ t: 'drone', p: 0.55 }];
    if (w >= 2) m.push({ t: 'speeder', p: 0.25 });
    if (w >= 3) m.push({ t: 'splitter', p: 0.15 });
    if (w >= 4) m.push({ t: 'tank', p: 0.15 });
    const total = m.reduce((s, e) => s + e.p, 0);
    return m.map((e) => ({ t: e.t, p: e.p / total }));
  },
  bossWave: (w) => w % 5 === 0,
  enemyHpScale: (w) => 1 + (w - 1) * 0.14,
  spawnInterval: 0.55,
  pickupChance: 0.16,
  pickupLife: 9,
  UPGRADES: [
    { id: 'dmg',   name: 'Overcharged Rounds', desc: '+30% bullet damage', key: '1' },
    { id: 'rate',  name: 'Rapid Cycler', desc: '+25% fire rate', key: '2' },
    { id: 'multi', name: 'Split Cannon', desc: '+1 projectile per shot (max 3)', key: '3' },
    { id: 'hull',  name: 'Reinforced Hull', desc: '+30 max hull and repair 30', key: '4' },
    { id: 'speed', name: 'Ion Thrusters', desc: '+15% move speed', key: '5' },
  ],
  COLORS: { bg: '#070818', grid: '#12142e', star: '#8b93b8' },
};
