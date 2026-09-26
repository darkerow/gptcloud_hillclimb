import Phaser from "phaser";

const { Body, Constraint } = Phaser.Physics.Matter.Matter;
const THICKNESS = 14;
const APPROACH = 220;

// Metres in the HUD are (worldX - 260) / 10. First bridge starts at 140 m.
export const BRIDGE_SPANS = Object.freeze([
  { start: 1660, end: 2140 },
  { start: 4840, end: 5440 },
  { start: 8680, end: 9400 },
  { start: 12880, end: 13480 },
  { start: 17860, end: 18640 }
]);

function naturalHeight(x) {
  const difficulty = Phaser.Math.Clamp((x - 5000) / 13000, 0, 1);
  return 560 + Math.sin(x * 0.0024) * 82 + Math.sin(x * 0.0062 + 1.2) * 42
    + Math.sin(x * 0.014 + 0.6) * 13 + Math.sin(x * 0.0105 + 2.1) * 60 * difficulty;
}

const spans = BRIDGE_SPANS.map(span => ({
  ...span, y: (naturalHeight(span.start) + naturalHeight(span.end)) / 2
}));
const smooth = t => t * t * (3 - 2 * t);

export function bridgeAt(x) {
  return spans.find(span => x > span.start && x < span.end);
}

// Level bridge abutments blend into the original hills without a launch lip.
// Inside the gap this is the deck reference height, NOT a ground collider.
export function terrainHeight(x) {
  const height = naturalHeight(x);
  for (const span of spans) {
    if (x < span.start - APPROACH || x > span.end + APPROACH) continue;
    const blend = x < span.start ? smooth((x - span.start + APPROACH) / APPROACH)
      : x > span.end ? smooth((span.end + APPROACH - x) / APPROACH) : 1;
    return height + (span.y - height) * blend;
  }
  return height;
}

function makeBridge(scene, span) {
  const count = Math.round((span.end - span.start) / 32);
  const step = (span.end - span.start) / count;
  const group = Body.nextGroup(true);
  const planks = Array.from({ length: count }, (_, i) => scene.matter.add.rectangle(
    span.start + (i + 0.5) * step, span.y + THICKNESS / 2, step + 1, THICKNESS, {
      isStatic: i === 0 || i === count - 1,
      // Same drivable label as soil: monowheel balance and crash detection work.
      label: "terrain", plugin: { bridge: true }, collisionFilter: { group },
      chamfer: { radius: 2 }, density: 0.008, friction: 1, frictionStatic: 2,
      frictionAir: 0.06, restitution: 0
    }
  ));
  const constraints = [];
  for (let i = 1; i < count; i++) {
    constraints.push(Constraint.create({
      bodyA: planks[i - 1], pointA: { x: step / 2, y: 0 },
      bodyB: planks[i], pointB: { x: -step / 2, y: 0 },
      length: 0, stiffness: 0.98, damping: 0.12
    }));
  }
  scene.matter.world.add(constraints);
  return { ...span, planks, constraints, step };
}

function drawLand(scene, track, from, to) {
  const points = [{ x: from, y: terrainHeight(from) }];
  // Keep the old sampling grid away from bridges. Refine just the approaches.
  for (let x = -500; x < to; x += 90) if (x > from) points.push({ x, y: terrainHeight(x) });
  for (const span of spans) {
    for (let x = span.start - APPROACH; x <= span.start; x += 22)
      if (x > from && x < to) points.push({ x, y: terrainHeight(x) });
    for (let x = span.end; x <= span.end + APPROACH; x += 22)
      if (x > from && x < to) points.push({ x, y: terrainHeight(x) });
  }
  points.push({ x: to, y: terrainHeight(to) });
  points.sort((a, b) => a.x - b.x);
  const unique = points.filter((p, i) => !i || p.x > points[i - 1].x + 0.01);
  const g = track.land;
  g.fillStyle(0x82704e).beginPath().moveTo(from, 1800).lineTo(from, unique[0].y);
  for (const p of unique) g.lineTo(p.x, p.y);
  g.lineTo(to, 1800).closePath().fillPath();
  // A grassy cap, with exposed rock walls at the ravines.
  g.fillStyle(0x6c9b49).beginPath().moveTo(from, unique[0].y);
  for (const p of unique) g.lineTo(p.x, p.y);
  for (const p of [...unique].reverse()) g.lineTo(p.x, p.y + 45);
  g.closePath().fillPath();
  g.lineStyle(7, 0x3f6f2b).beginPath().moveTo(from, unique[0].y);
  for (const p of unique) g.lineTo(p.x, p.y);
  g.strokePath();
  for (let i = 0; i < unique.length - 1; i++) {
    const a = unique[i], b = unique[i + 1];
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    track.terrainBodies.push(scene.matter.add.rectangle(
      (a.x + b.x) / 2 - Math.sin(angle) * 35,
      (a.y + b.y) / 2 + Math.cos(angle) * 35,
      Math.hypot(b.x - a.x, b.y - a.y) + 2, 70,
      { isStatic: true, angle, friction: 1, restitution: 0, label: "terrain" }
    ));
  }
}

export function createTrack(scene, worldWidth, startX) {
  const track = {
    terrainBodies: [], bridges: [], decorations: [],
    backdrop: scene.add.graphics().setDepth(0), land: scene.add.graphics().setDepth(1),
    deck: scene.add.graphics().setDepth(3)
  };
  let from = -500;
  for (const span of spans) {
    drawLand(scene, track, from, span.start);
    track.bridges.push(makeBridge(scene, span));
    const g = track.backdrop;
    // Deep open ravine: no invisible soil under the moving deck.
    g.fillStyle(0x405f60).fillRect(span.start, span.y + 280, span.end - span.start, 1520);
    g.fillStyle(0x4c9eac).fillRect(span.start, span.y + 280, span.end - span.start, 20);
    g.lineStyle(3, 0x8ad2db, 0.8);
    for (let x = span.start + 20; x < span.end - 20; x += 58)
      g.lineBetween(x, span.y + 289, x + 27, span.y + 289);
    from = span.end;
  }
  drawLand(scene, track, from, worldWidth + 600);
  for (let x = startX + 1000; x < worldWidth - 700; x += 1000) {
    if (bridgeAt(x)) continue;
    track.decorations.push(scene.add.text(x, terrainHeight(x) - 52, `${Math.round((x - startX) / 10)} м`, {
      fontFamily: "Arial", fontStyle: "bold", fontSize: "22px", color: "#fff", stroke: "#2a4d21", strokeThickness: 5
    }).setOrigin(0.5).setDepth(2));
  }
  drawBridges(track);
  return track;
}

function local(body, x, y) {
  const c = Math.cos(body.angle), s = Math.sin(body.angle);
  return { x: body.position.x + x * c - y * s, y: body.position.y + x * s + y * c };
}

export function drawBridges(track) {
  if (!track) return;
  const g = track.deck;
  g.clear();
  for (const bridge of track.bridges) {
    const { planks, start, end, y, step } = bridge;
    // Ropes and hangers use the actual deck positions, including its deflection.
    for (const x of [start - 10, end + 10]) {
      g.fillStyle(0x513c28).fillRoundedRect(x - 6, y - 88, 12, 110, 3);
      g.fillStyle(0xc7a777).fillRect(x - 7, y - 77, 14, 5);
    }
    g.lineStyle(4, 0x544334).beginPath().moveTo(start - 10, y - 76);
    for (const plank of planks) g.lineTo(plank.position.x, plank.position.y - 62);
    g.lineTo(end + 10, y - 76).strokePath();
    for (let i = 0; i < planks.length; i++) {
      const p = planks[i], top = local(p, 0, -THICKNESS / 2);
      if (i % 2 === 0) g.lineStyle(2, 0x7e6547).lineBetween(p.position.x, p.position.y - 62, top.x, top.y);
      g.fillStyle(i % 2 ? 0xae733b : 0xc18a49).lineStyle(1.5, 0x5a3b24).beginPath();
      const corners = [[-step / 2, -7], [step / 2, -7], [step / 2, 7], [-step / 2, 7]];
      corners.forEach(([x, y], n) => { const q = local(p, x, y); n ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y); });
      g.closePath().fillPath().strokePath();
      const a = local(p, -step / 2 + 2, -5), b = local(p, step / 2 - 2, -5);
      g.lineStyle(2, 0xf0c27e).lineBetween(a.x, a.y, b.x, b.y);
      for (const x of [-step / 2 + 5, step / 2 - 5]) {
        const q = local(p, x, 2); g.fillStyle(0x624e36).fillCircle(q.x, q.y, 1.7);
      }
    }
  }
}

export function resetBridges(track) {
  if (!track) return;
  for (const bridge of track.bridges) {
    bridge.planks.forEach((body, i) => {
      Body.setPosition(body, { x: bridge.start + (i + 0.5) * bridge.step, y: bridge.y + THICKNESS / 2 });
      Body.setAngle(body, 0); Body.setVelocity(body, { x: 0, y: 0 }); Body.setAngularVelocity(body, 0);
      body.force.x = body.force.y = body.torque = 0;
      body.constraintImpulse.x = body.constraintImpulse.y = body.constraintImpulse.angle = 0;
      body.positionImpulse.x = body.positionImpulse.y = 0;
    });
    // Solver rotates local anchors in place. Restore them along with body angles.
    bridge.constraints.forEach(c => {
      c.pointA.x = bridge.step / 2; c.pointA.y = 0;
      c.pointB.x = -bridge.step / 2; c.pointB.y = 0;
      c.angleA = c.angleB = 0;
    });
  }
  drawBridges(track);
}

export function destroyTrack(scene, track) {
  if (!track) return;
  for (const bridge of track.bridges) {
    scene.matter.world.remove(bridge.constraints);
    scene.matter.world.remove(bridge.planks);
  }
  scene.matter.world.remove(track.terrainBodies);
  for (const obj of [track.backdrop, track.land, track.deck, ...track.decorations]) obj.destroy();
}
