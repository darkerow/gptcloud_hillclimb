import Phaser from "phaser";

const { Body, Constraint } = Phaser.Physics.Matter.Matter;
const clamp = Phaser.Math.Clamp;

/** All bodies in a vehicle share a negative group: no self-collisions. */
export function createVehicle(scene, type, x, groundY) {
  const group = Body.nextGroup(true);
  const options = { collisionFilter: { group }, restitution: 0, frictionAir: 0.012 };
  const wheel = (wx, wy, radius) => scene.matter.add.circle(wx, wy, radius, {
    ...options, density: 0.003, friction: 1, frictionStatic: 2, label: "wheel"
  });
  let body, wheels, constraints;

  if (type === "monowheel") {
    const axleY = groundY - 80;
    body = scene.matter.add.rectangle(x, axleY - 68, 28, 102, {
      ...options, chamfer: { radius: 9 }, density: 0.0022,
      friction: 0.7, label: "rider"
    });
    wheels = [wheel(x, axleY, 32)];
    // A revolute axle: the tire spins independently of the rider and casing.
    constraints = [Constraint.create({
      bodyA: body, pointA: { x: 0, y: 68 }, bodyB: wheels[0],
      length: 0, stiffness: 0.98, damping: 0.2
    })];
  } else {
    const y = groundY - 135;
    body = scene.matter.add.rectangle(x, y, 128, 42, {
      ...options, chamfer: { radius: 12 }, density: 0.0027,
      friction: 0.7, label: "chassis"
    });
    wheels = [wheel(x - 48, y + 43, 27), wheel(x + 48, y + 43, 27)];
    constraints = wheels.flatMap((w, i) => {
      const side = i === 0 ? -1 : 1;
      return [Constraint.create({
        bodyA: body, pointA: { x: side * 48, y: 21 }, bodyB: w,
        length: 22, stiffness: 0.65, damping: 0.16
      }), Constraint.create({
        bodyA: body, pointA: { x: -side * 48, y: 21 }, bodyB: w,
        length: Math.hypot(96, 22), stiffness: 0.8, damping: 0.1
      })];
    });
  }
  scene.matter.world.add(constraints);
  const vehicle = { type, body, wheels, constraints, graphics: scene.add.graphics().setDepth(10) };
  drawVehicle(vehicle);
  return vehicle;
}

export function destroyVehicle(scene, vehicle) {
  if (!vehicle) return;
  scene.matter.world.remove(vehicle.constraints);
  scene.matter.world.remove([vehicle.body, ...vehicle.wheels]);
  vehicle.graphics.destroy();
}

/** Contact state comes from the physics solver, not the visual terrain curve. */
export function getContacts(scene, vehicle) {
  let grounded = false, bodyHit = false;
  const wheelIds = new Set(vehicle.wheels.map(w => w.id));
  for (const pair of scene.matter.world.engine.pairs.list) {
    if (!pair.isActive) continue;
    const a = pair.bodyA.parent, b = pair.bodyB.parent;
    const dynamic = a.label === "terrain" ? b : b.label === "terrain" ? a : null;
    if (dynamic) {
      grounded ||= wheelIds.has(dynamic.id);
      bodyHit ||= dynamic.id === vehicle.body.id;
    }
  }
  return { grounded, bodyHit };
}

/** Called before each physics step, so input does not depend on render FPS. */
export function driveVehicle(vehicle, input, delta, grounded) {
  const { body, wheels, type } = vehicle;
  const dt = clamp(delta / (1000 / 60), 0.25, 2);
  const mono = type === "monowheel";
  const limit = mono ? 0.52 : 0.48;
  for (const wheel of wheels) {
    if (input !== 0) {
      Body.setAngularVelocity(wheel, clamp(wheel.angularVelocity + input * 0.035 * dt, -limit, limit));
    } else if (mono && grounded) {
      Body.setAngularVelocity(wheel, wheel.angularVelocity * Math.pow(0.92, dt));
    }
  }
  if (mono) {
    const angle = Phaser.Math.Angle.Wrap(body.angle);
    if (grounded && Math.abs(angle) < 1.2) {
      // Arcade electric balancing assist. It cannot rescue a fallen rider.
      const targetLean = input * 0.13;
      const correction = (targetLean - angle) * 0.045 - body.angularVelocity * 0.35;
      Body.setAngularVelocity(body, clamp(body.angularVelocity + correction * dt, -0.13, 0.13));
    } else if (!grounded) {
      Body.setAngularVelocity(body, clamp(body.angularVelocity + input * 0.0018 * dt, -0.1, 0.1));
    }
  } else if (!grounded && input !== 0) {
    Body.setAngularVelocity(body, clamp(body.angularVelocity + input * 0.0014 * dt, -0.12, 0.12));
  }
}

export function drawVehicle(vehicle) {
  const { graphics: g, body, wheels, type } = vehicle;
  g.clear();
  for (const w of wheels) {
    const r = w.circleRadius;
    g.fillStyle(0x192330).fillCircle(w.position.x, w.position.y, r);
    g.lineStyle(4, 0x384858).strokeCircle(w.position.x, w.position.y, r - 4);
    g.fillStyle(type === "monowheel" ? 0xffaa32 : 0xc3d4de).fillCircle(w.position.x, w.position.y, r * 0.5);
    const ax = Math.cos(w.angle) * r * 0.7, ay = Math.sin(w.angle) * r * 0.7;
    g.lineStyle(4, 0x63798b).lineBetween(w.position.x - ax, w.position.y - ay, w.position.x + ax, w.position.y + ay);
    g.fillStyle(0x182533).fillCircle(w.position.x, w.position.y, 5);
  }
  const cos = Math.cos(body.angle), sin = Math.sin(body.angle);
  const p = (x, y) => ({ x: body.position.x + x * cos - y * sin, y: body.position.y + x * sin + y * cos });
  const polygon = (points, color, stroke = 0x26394a, width = 3) => {
    g.fillStyle(color).lineStyle(width, stroke);
    g.beginPath();
    points.forEach(([x, y], i) => { const q = p(x, y); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); });
    g.closePath(); g.fillPath(); g.strokePath();
  };
  const line = (points, width, color) => {
    g.lineStyle(width, color); g.beginPath();
    points.forEach(([x, y], i) => { const q = p(x, y); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); });
    g.strokePath();
  };
  const circle = (x, y, r, color) => { const q = p(x, y); g.fillStyle(color).fillCircle(q.x, q.y, r); };

  if (type === "monowheel") {
    // No handlebar or second wheel: a standing electric-unicycle rider.
    polygon([[-17, 45], [-18, 31], [14, 29], [20, 48], [13, 66], [-10, 66]], 0x26384a);
    line([[-12, 40], [12, 38]], 4, 0x63e6e2);
    line([[-3, 0], [-13, 27], [-5, 61]], 11, 0x26394a);
    line([[5, 0], [21, 24], [8, 61]], 12, 0x426581);
    line([[-15, 65], [26, 65]], 6, 0x101c2b);
    line([[-3, 60], [23, 60]], 8, 0x1b2a3a);
    polygon([[-14, -40], [9, -44], [16, -5], [3, 7], [-14, -1]], 0xf98134);
    line([[5, -35], [28, -15], [39, -29]], 9, 0xfc9844);
    circle(39, -29, 5, 0xffd0a5);
    circle(0, -58, 16, 0x223449);
    polygon([[0, -67], [17, -65], [21, -58], [2, -56]], 0x8ae5ef, 0x223449, 2);
    polygon([[4, -53], [21, -52], [16, -44], [-2, -46]], 0xf98134, 0x223449, 2);
    line([[-10, -69], [4, -72]], 4, 0xffae46);
  } else {
    for (const [i, w] of wheels.entries()) {
      const anchor = p(i === 0 ? -48 : 48, 13);
      g.lineStyle(6, 0x536575).lineBetween(anchor.x, anchor.y, w.position.x, w.position.y);
    }
    polygon([[-66, -23], [42, -23], [66, 5], [55, 24], [-62, 24], [-73, 5]], 0xef5b2a, 0x7d2610, 4);
    polygon([[-18, -24], [8, -50], [43, -47], [52, -23]], 0xd9f5ff);
    circle(14, -36, 10, 0xffd2a6);
    line([[-57, -6], [41, -6]], 4, 0xffa24a);
    polygon([[55, -1], [65, 3], [62, 12], [53, 10]], 0xffe9a8, 0x7d2610, 2);
  }
}
