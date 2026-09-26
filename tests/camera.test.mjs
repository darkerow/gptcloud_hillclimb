import test from 'node:test';
import assert from 'node:assert/strict';
import { VehicleCameraRig, vehicleCameraAnchor } from '../src/camera.js';

function fixture(type = 'monowheel') {
  const camera = {
    startFollow(target, roundPixels, lerpX, lerpY, x, y) {
      Object.assign(this, { target, roundPixels, lerpX, lerpY });
      this.setFollowOffset(x, y);
    },
    setFollowOffset(x, y) { this.offset = { x, y }; },
    stopFollow() { this.target = null; }
  };
  const vehicle = { type, body: { position: { x: 500, y: 432 }, angle: 0 },
    wheels: [{ position: { x: 500.25, y: 500.75 } }] };
  if (type === 'car') vehicle.wheels.push({ position: { x: 596.25, y: 500.75 } });
  const rig = new VehicleCameraRig(camera);
  rig.track(vehicle, 1280);
  return { camera, vehicle, rig };
}

for (const type of ['car', 'monowheel']) {
  test(`${type}: follow stable axle, not oscillating body; no pixel rounding`, () => {
    const { rig, camera, vehicle } = fixture(type);
    const initial = { ...rig.target };
    for (let i = 0; i < 600; i++) {
      vehicle.body.position.x = 500 + Math.sin(i) * 25;
      vehicle.body.position.y = 430 + Math.cos(i) * 15;
      vehicle.body.angle = Math.sin(i) * 0.25;
      rig.update(1000 / 60);
    }
    assert.deepEqual(rig.target, initial);
    assert.equal(camera.roundPixels, false);
    assert.equal(camera.lerpX, 1);
    assert.notEqual(camera.target, vehicle.body.position);
  });

  test(`${type}: small bumps don't shake camera vertically`, () => {
    const { rig, vehicle } = fixture(type);
    const initial = rig.target.y;
    for (let i = 0; i < 600; i++) {
      vehicle.wheels.forEach(w => { w.position.y = 500.75 + Math.sin(i * 1.2) * 8; });
      rig.update(1000 / 60);
      assert.equal(rig.target.y, initial);
    }
  });
}

test('30, 60 and 144 Hz give comparable follow lag', () => {
  const values = [30, 60, 144].map(fps => {
    const { rig, vehicle } = fixture();
    for (let i = 1; i <= fps * 3; i++) {
      vehicle.wheels[0].position.x = 500.25 + i / fps * 400;
      rig.update(1000 / fps);
    }
    return rig.target.x;
  });
  assert.ok(Math.max(...values) - Math.min(...values) < 6, JSON.stringify(values));
});

test('damping strongly attenuates high-frequency horizontal vibration', () => {
  const { rig, vehicle } = fixture();
  let old = 500.25;
  const samples = [], previous = [];
  for (let i = 0; i < 720; i++) {
    const x = 500.25 + 8 * Math.sin(i * Math.PI / 2);
    vehicle.wheels[0].position.x = x;
    rig.update(1000 / 60);
    old += (x - old) * 0.09;
    if (i > 120) { samples.push(rig.target.x); previous.push(old); }
  }
  const range = xs => Math.max(...xs) - Math.min(...xs);
  assert.ok(range(samples) < range(previous) * 0.5);
  console.log('Vibration amplitude, old/new:', range(previous), range(samples));
});

test('hills and jumps still move camera, with no instantaneous snap', () => {
  const { rig, vehicle } = fixture();
  const before = rig.target.y;
  vehicle.wheels[0].position.y -= 150;
  rig.update(1000 / 60);
  assert.ok(before - rig.target.y < 2);
  for (let i = 0; i < 180; i++) rig.update(1000 / 60);
  assert.ok(Math.abs(rig.target.y - (before - 150 + 18)) < 0.01);
});

test('resize preserves motion; restart resets history; invalid delta is harmless', () => {
  const { rig, vehicle } = fixture();
  vehicle.wheels[0].position.x += 400;
  rig.update(16);
  const before = { ...rig.target }, velocity = rig.x.velocity;
  rig.resize(390);
  assert.deepEqual(rig.target, before);
  assert.equal(rig.x.velocity, velocity);
  rig.update(NaN); rig.update(-1); rig.update(0);
  assert.deepEqual(rig.target, before);
  rig.track(vehicle, 390);
  assert.deepEqual(rig.target, vehicleCameraAnchor(vehicle));
  assert.equal(rig.x.velocity, 0);
  rig.destroy(); rig.update(16);
});
