/**
 * Follow the axle, not the suspension/rider. Keep the camera independent of
 * physical body rotation and use one time-based filter, never a per-frame lerp.
 * This module has no Phaser dependency so its motion can be regression-tested.
 */
const VERTICAL_DEAD_ZONE = 18;

function damp(axis, target, seconds, smoothTime) {
  // Exact critically damped response to a constant target over this frame.
  const omega = 2 / smoothTime;
  const offset = axis.value - target;
  const impulse = (axis.velocity + omega * offset) * seconds;
  const decay = Math.exp(-omega * seconds);
  axis.value = target + (offset + impulse) * decay;
  axis.velocity = (axis.velocity - omega * impulse) * decay;
}

export function vehicleCameraAnchor(vehicle) {
  let x = 0, y = 0;
  for (const wheel of vehicle.wheels) {
    x += wheel.position.x;
    y += wheel.position.y;
  }
  const count = vehicle.wheels.length;
  // Match the original framing without inheriting body lean or suspension bob.
  return { x: x / count, y: y / count - (vehicle.type === "monowheel" ? 68 : 43) };
}

export class VehicleCameraRig {
  constructor(camera) {
    this.camera = camera;
    this.target = { x: 0, y: 0 };
    this.x = { value: 0, velocity: 0 };
    this.y = { value: 0, velocity: 0 };
    this.vehicle = null;
    this.heightTarget = 0;
  }

  track(vehicle, viewportWidth) {
    this.vehicle = vehicle;
    const anchor = vehicleCameraAnchor(vehicle);
    this.x.value = this.target.x = anchor.x;
    this.y.value = this.target.y = this.heightTarget = anchor.y;
    this.x.velocity = this.y.velocity = 0;
    // Graphics are vector-based. Whole-pixel camera steps produce visible judder
    // at low speed and on high-refresh-rate screens, so retain fractional values.
    this.camera.startFollow(this.target, false, 1, 1,
      -Math.min(viewportWidth * 0.17, 180), vehicle.type === "monowheel" ? 15 : 60);
  }

  resize(viewportWidth) {
    if (!this.vehicle) return;
    // Resizing must not reset damping or startFollow (which snaps the camera).
    this.camera.setFollowOffset(-Math.min(viewportWidth * 0.17, 180),
      this.vehicle.type === "monowheel" ? 15 : 60);
  }

  update(deltaMs) {
    if (!this.vehicle || !Number.isFinite(deltaMs) || deltaMs <= 0) return;
    // Don't turn a suspended tab / lost frame into a huge camera jump.
    const seconds = Math.min(deltaMs, 50) / 1000;
    const anchor = vehicleCameraAnchor(this.vehicle);
    const error = anchor.y - this.heightTarget;
    if (Math.abs(error) > VERTICAL_DEAD_ZONE) {
      this.heightTarget = anchor.y - Math.sign(error) * VERTICAL_DEAD_ZONE;
    }
    damp(this.x, anchor.x, seconds, 0.12);
    damp(this.y, this.heightTarget, seconds, 0.32);
    this.target.x = this.x.value;
    this.target.y = this.y.value;
  }

  destroy() {
    this.camera.stopFollow();
    this.vehicle = null;
  }
}
