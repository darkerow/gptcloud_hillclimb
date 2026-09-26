# Version 0.4 — arcade presentation and suspension

## Presentation

The garage is now an illustrated game screen rather than a web catalogue. Vehicle and stage rails support buttons, keyboard arrows and swipes on the main preview. The selected vehicle uses exactly the same body/wheel painter as the in-game vehicle. Mobile layouts keep the start button outside scrolling content. The workshop, missions, store, pause, results and settings use the same tactile wood/metal visual language.

All 32 vehicles now have authored Canvas artwork: different silhouettes, wheels with tyre tread and metal rims, windows, drivers, body trim, lights, tracks and special equipment. Sprites are cached at double resolution; physics still controls chassis and each wheel separately. Spring coils connect the actual moving suspension endpoints. No Hill Climb Racing sprites, fonts, textures, audio, code or extracted physics data are used.

The HUD uses high-contrast transparent counters, a fuel gauge, metal pedals and animated speed/RPM needles. Collectible coins show denominations; fuel cans, crystals, dust and water/mud spray have new artwork. Landscape drawing includes layered hills, trees, buildings, fences, cacti, palm trees, rock textures, snow, ice, industrial structures, cave crystals, planets and weather. The 30 stage presets retain their individual terrain, gravity and grip parameters.

## Suspension

The former rigid diagonal triangulation has been replaced by an axle-height trailing link and a separate spring per wheel. The trailing link constrains wheelbase while allowing suspension travel. Spring strength, damping, travel, rotational inertia and airborne control vary by vehicle class; rally, trophy, off-road, lunar, lowrider, minibike, superbike, dragster, electric, safari, armored and custom models have additional overrides.

Progressive bump stops stiffen near compression/droop limits. High-bodied vehicles have more suspension clearance so the wheels do not invert past the chassis mount. Suspension upgrades increase damping and useful travel, rather than merely making joints rigid. The monowheel retains its independent axle and arcade balancing assistance. Camera damping and fractional scrolling are preserved unchanged.

## Track elements

- Arctic/snow/glacier alternate low-grip ice with grippier snow outside the intro.
- Beach/islands/swamp include visible shallow-water zones; mud zones apply stronger drag. Hovercraft is less affected by drag.
- Highway/roller/rainbow/alien include marked acceleration strips.
- Mountain/canyon/wasteland/Mars have physical rolling rocks; construction/factory/city/mines have movable crates.
- Storm applies changing wind forces; rain, snow and autumn leaves are decorative weather. Volcano keeps lava ravines beneath the flexible bridges.

These are original implementations, not identical replicas of all special events in the commercial game. Obstacles are culled behind the player; particles and rendered collectible pools are bounded. All physics elements reset with the run.

## Reproducible checks

`npm test`: 21 unit tests for the camera, progression and suspension configuration.

`python tests/smoke.py`: roster, stages, economic operations, pause, fuel, all five original bridge positions on car and monowheel, camera movement, bounded streaming world, restarts and mobile multitouch.

`python tests/handling.py`: all 960 stock vehicle/stage combinations are spawned, settled for 90 fixed steps and driven for 80 steps. The report records displacement, run termination, finite coordinates and gravity. This is a short introductory-segment compatibility check, **not** a full-course or unlimited-distance completion test.

The handling suite additionally drops every model 100 world pixels onto a flat test floor, measures compression and final settling, rejects inverted springs, verifies surface/event forces and checks actual hit-testing of the start button at 1280×720, 390×844, 844×390 and 320×568. Reports and screenshots are uploaded with the CI artifact.

## Reference material

Visual/gameplay direction was compared with the official first-game screenshots and description:

- https://play.google.com/store/apps/details?id=com.fingersoft.hillclimb
- https://fingersoft.com/games/hill-climb-racing/

Joint behaviour was checked against the Matter.js reference:

- https://brm.io/matter-js/docs/classes/Constraint.html

Exact spring constants and balance parameters are authored and tested for this implementation, not inferred to be the commercial game's settings.
