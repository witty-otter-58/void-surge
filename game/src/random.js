// mulberry32: small deterministic RNG so staged screenshots are repeatable.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickWeighted(rng, entries) {
  let roll = rng();
  for (const e of entries) {
    roll -= e.p;
    if (roll <= 0) return e.t;
  }
  return entries[entries.length - 1].t;
}
