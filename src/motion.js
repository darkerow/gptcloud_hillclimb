/** Render solved Matter poses between fixed ticks without ever moving a collider.
 * Phaser 3.90 / Matter 0.20 keeps half a tick in the runner's time buffer.
 * The browser regression exercises the real World.update to guard this contract.
 */
export function renderAlpha(runner) {
  const step = runner?.delta;
  if (!(step > 0) || !Number.isFinite(runner.timeBuffer)) return 1;
  return Math.max(0, Math.min(1, runner.timeBuffer / step - 0.5));
}

const copy = body => ({ x: body.position.x, y: body.position.y, angle: body.angle });
function write(to, body) {
  to.x = body.position.x; to.y = body.position.y; to.angle = body.angle;
}

export class RenderMotion {
  constructor(world) {
    this.world = world;
    this.sample = this.sample.bind(this);
    this.reset();
    world.on('beforeupdate', this.beforeStep, this);
    world.on('afterupdate', this.afterStep, this);
  }

  reset() {
    // Weak keys let streamed-out bridges and obstacles be garbage-collected.
    this.poses = new WeakMap();
    this.alpha = 1;
  }

  seed(body) {
    const entry = { previous: copy(body), current: copy(body),
      view: { position: { ...body.position }, angle: body.angle } };
    this.poses.set(body, entry);
    return entry;
  }

  beforeStep() {
    for (const body of this.world.getAllBodies()) {
      if (body.isStatic) continue;
      const entry = this.poses.get(body) || this.seed(body);
      // Do NOT use Body.positionPrev: the solver changes it to encode velocity.
      write(entry.previous, body);
    }
  }

  afterStep() {
    for (const body of this.world.getAllBodies()) {
      if (body.isStatic) continue;
      const entry = this.poses.get(body) || this.seed(body);
      write(entry.current, body);
    }
  }

  beginFrame() {
    // Preserve the exact displayed pose while paused, including a mid-tick pause.
    if (this.world.enabled && this.world.autoUpdate) this.alpha = renderAlpha(this.world.runner);
  }

  frameDelta(fallback) {
    // The native runner can smooth/snap elapsed time. Camera damping must use
    // that SAME clock, not Phaser's separately smoothed render delta.
    const delta = this.world.autoUpdate ? this.world.runner.frameDelta : fallback;
    return Number.isFinite(delta) && delta > 0 ? delta : fallback;
  }

  sample(body) {
    // Manual physics stepping remains exact for debugging and offline tests.
    if (body.isStatic || !this.world.autoUpdate) return body;
    let e = this.poses.get(body);
    if (!e) return body;
    if (body.position.x !== e.current.x || body.position.y !== e.current.y || body.angle !== e.current.angle) {
      // Explicit repositioning / respawn must never interpolate from the old pose.
      e = this.seed(body);
    }
    const a = this.alpha, p = e.previous, q = e.current, v = e.view;
    v.position.x = p.x + (q.x - p.x) * a;
    v.position.y = p.y + (q.y - p.y) * a;
    // Matter angles are continuous, including spinning wheels and full flips.
    v.angle = p.angle + (q.angle - p.angle) * a;
    return v;
  }

  destroy() {
    this.world.off('beforeupdate', this.beforeStep, this);
    this.world.off('afterupdate', this.afterStep, this);
    this.reset();
  }
}
