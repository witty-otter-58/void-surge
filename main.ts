// Void Surge entrypoint (Node 22, standard library only).
//
// The game itself is plain static files under game/ — index.html plus ES
// modules, no libraries, no network requests — so a desktop browser plays it
// straight off disk. This program's only job is to hand it in: copy game/
// and screenshots/ beside this file into the output directory and write
// dossier.json, the summary the judge reads, using the vendored make.fun
// library. It runs twice in the sandbox and must produce byte-identical
// output both times, so it does no I/O beyond those copies.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const gameDir = join(root, 'game');
const shotsDir = join(root, 'screenshots');

mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's caps (reference/gate.json): text_max_bytes is the only one
// that shapes the dossier's bytes. The rest refuse an entry the scorer
// would refuse — more than 4 screenshots, one over 256 KiB, more than 993
// files or 48 MiB of game files in all, or a path under game/ over 1000
// bytes.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
