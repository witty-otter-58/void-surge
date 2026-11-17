# Void Surge

[![best-game-01](https://make.fun/bounty/best-game-01/badge.svg)](https://make.fun/bounty/best-game-01)
[![best-game-01](https://make.fun/bounty/best-game-01/badge2.svg)](https://make.fun/bounty/best-game-01)
[![best-game-01](https://make.fun/bounty/best-game-01/badge3.svg)](https://make.fun/bounty/best-game-01)

Void Surge is an arena survival shooter: pilot the last interceptor through
10 waves of void creatures pouring out of a rift. Move with WASD, aim with
the mouse, hold fire, grab pickups, and pick an upgrade after every cleared
wave. Bosses arrive on waves 5 and 10.

Open `game/index.html` in a desktop browser — it plays fully offline, no
network requests, no build step. Sound is synthesized with WebAudio.

## How to play

- **Move** WASD / arrow keys, **aim** mouse, **fire** hold click or Space
- **1/2/3** choose an upgrade after a cleared wave
- **P** pause, **M** mute, **R** restart

## Files

- `game/index.html` — page, HUD and overlays
- `game/src/config.js` — every tuning number
- `game/src/random.js` — seeded RNG
- `game/src/audio.js` — synthesized sound effects
- `game/src/enemies.js` — enemy types, spawning, splitting
- `game/src/world.js` — state, waves, combat, pickups, upgrades
- `game/src/render.js` — canvas drawing
- `game/src/input.js` — keyboard/mouse and the screenshot autopilot
- `game/src/shots.js` — `?shot=` staging (title/play/victory/defeat)
- `game/src/main.js` — shell, loop, HUD, overlays
