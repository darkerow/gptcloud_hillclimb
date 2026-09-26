import test from 'node:test';
import assert from 'node:assert/strict';
import { RenderMotion, renderAlpha } from '../src/motion.js';
import { vehicleCameraAnchor } from '../src/camera.js';

function fixture() {
  const body = { position: { x: 100, y: 200 }, angle: 0, isStatic: false };
  const events = new Map();
  const world = { autoUpdate: true, enabled: true, runner: { delta: 1000 / 60, timeBuffer: 0 },
    getAllBodies: () => [body],
    on(name, fn, context) { events.set(name, { fn, context }); },
    off(name) { events.delete(name); },
    emit(name) { const e = events.get(name); e?.fn.call(e.context); } };
  const motion = new RenderMotion(world);
  const tick = (dx = 10, dy = 4, da = 0.2) => {
    world.emit('beforeupdate');
    body.position.x += dx; body.position.y += dy; body.angle += da;
    world.emit('afterupdate');
  };
  return { body, world, motion, tick, events };
}

test('Matter 3.90 buffer margin gives a continuous interpolation phase', () => {
  for (const [buffer, expected] of [[0, 0], [0.5, 0], [0.75, 0.25], [1, 0.5], [1.5, 1], [3, 1]]) {
    assert.ok(Math.abs(renderAlpha({ delta: 20, timeBuffer: buffer * 20 }) - expected) < 1e-10);
  }
  assert.equal(renderAlpha({ delta: 0, timeBuffer: 5 }), 1);
  assert.equal(renderAlpha({ delta: 20, timeBuffer: NaN }), 1);
});

test('render both location and wheel rotation on frames with no physics tick', () => {
  const { body, world, motion, tick } = fixture();
  tick();
  for (const a of [0, 0.25, 0.5, 0.75, 1]) {
    world.runner.timeBuffer = (a + 0.5) * world.runner.delta; motion.beginFrame();
    const pose = motion.sample(body);
    assert.ok(Math.abs(pose.position.x - (100 + 10 * a)) < 1e-10);
    assert.ok(Math.abs(pose.position.y - (200 + 4 * a)) < 1e-10);
    assert.ok(Math.abs(pose.angle - 0.2 * a) < 1e-10);
    assert.deepEqual(body.position, { x: 110, y: 204 });
  }
});

test('multiple ticks keep the last solved pair and never use velocity-history positions', () => {
  const { body, motion, tick } = fixture();
  tick(); tick(); body.positionPrev = { x: -9999, y: -9999 };
  motion.alpha = 0.5;
  assert.equal(motion.sample(body).position.x, 115);
  tick(); motion.alpha = 0;
  assert.equal(motion.sample(body).position.x, 120);
});

test('camera and suspension can sample exactly the same wheel poses', () => {
  const { body, motion, tick } = fixture(); tick(); motion.alpha = 0.5;
  const anchor = vehicleCameraAnchor({ type: 'car', wheels: [body] }, motion.sample);
  assert.deepEqual(anchor, { x: 105, y: 159 });
  assert.equal(body.position.x, 110);
});

test('pause freezes interpolation; resume continues the existing solved pair', () => {
  const { body, world, motion, tick } = fixture(); tick(); motion.alpha = 0.4;
  const x = motion.sample(body).position.x;
  world.enabled = false; world.runner.timeBuffer = 10000; motion.beginFrame();
  assert.equal(motion.sample(body).position.x, x);
  world.enabled = true; world.runner.timeBuffer = world.runner.delta; motion.beginFrame();
  assert.equal(motion.sample(body).position.x, 105);
});

test('teleports, restarts, static bodies and manual stepping do not render stale poses', () => {
  const { body, world, motion, tick, events } = fixture(); tick(); motion.alpha = 0.2;
  body.position.x = 8000;
  assert.equal(motion.sample(body).position.x, 8000);
  motion.reset(); assert.equal(motion.sample(body), body);
  tick(); world.autoUpdate = false; assert.equal(motion.sample(body), body);
  world.autoUpdate = true; body.isStatic = true; assert.equal(motion.sample(body), body);
  motion.destroy(); assert.equal(events.size, 0);
});

test('spinning angles stay continuous across full revolutions', () => {
  const { body, motion, tick } = fixture(); body.angle = Math.PI * 12 - 0.1;
  tick(0, 0, 0.4); motion.alpha = 0.5;
  assert.ok(Math.abs(motion.sample(body).angle - (Math.PI * 12 + 0.1)) < 1e-10);
});


test('camera elapsed time matches the accepted physics runner clock', () => {
  const { world, motion } = fixture();
  world.runner.frameDelta = 9;
  assert.equal(motion.frameDelta(24), 9);
  world.runner.frameDelta = NaN;
  assert.equal(motion.frameDelta(24), 24);
  world.autoUpdate = false; world.runner.frameDelta = 9;
  assert.equal(motion.frameDelta(24), 24);
});
