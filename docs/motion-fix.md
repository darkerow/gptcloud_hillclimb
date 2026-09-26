# Vehicle frame judder — 0.4.1

## Reproduction

At high display refresh rates, the 60 Hz Matter runner deliberately skips physics
on some rendered frames. Previously the vehicle sprites were moved only inside
`afterPhysics`, whereas the camera moved every render frame. In the desktop flat-lane
120 Hz regression this made the vehicle move backwards on screen by about 6 pixels
on each skipped tick, although its physical position never went backwards.

## Fix

`RenderMotion` snapshots solved body transforms before/after ticks and interpolates
chassis, individual wheels, suspension endpoints, moving bridge planks and props
on every rendered frame. The camera samples those same wheel transforms.

The native Phaser 3.90 / Matter 0.20 runner leaves half a step in its accumulator:
the interpolation phase is `clamp(timeBuffer / delta - 0.5, 0, 1)`. Camera damping
uses `runner.frameDelta` too, avoiding another desynchronisation with Phaser's
separately smoothed render delta at uneven frame rates. Unit tests and the real
Phaser World.update browser test cover this version-specific timing contract.

Physics bodies, collision detection, fuel timing, spring tuning, traction and
vehicle balance are not interpolated or changed. This is rendering only, with
one solved-step interval of visual latency, never extrapolation. Pause freezes
the displayed pose; a new run/explicit reposition resets interpolation. Manual
`world.step` debugging with `autoUpdate=false` retains exact unsmoothed poses.

## Checks

- `npm test`: camera, suspension, progression and render snapshots/phase/reset.
- `python tests/smoke.py`: existing game, bridges, restarts and mobile input.
- `python tests/motion_smoke.py`: the production bundle, real scene frame events,
  30/60/90/120/144/165/240 Hz and uneven frame timing, car + monowheel, 1280x720
  and 390x844 viewports. Also pause/resume, reset, body/wheel phase agreement.

The frame-rate cases simulate frame timestamps in Chromium, not physical monitors.
The flat-lane fixture isolates rendering artefacts from real suspension motion;
it does not claim that every bump, crash or drop in frame rate is imperceptible.
Reports are in the CI `game-browser-screenshots` artifact as `motion-report.json`.
