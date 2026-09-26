import Phaser from "phaser";
import "./style.css";
import { createVehicle, destroyVehicle, drawVehicle, driveVehicle, getContacts } from "./vehicles.js";
import { createInterface } from "./garage.js";
import { readSetting, saveSetting, validVehicle, readBest } from "./storage.js";

const WORLD_WIDTH = 22000;
const TERRAIN_STEP = 90;
const START_X = 260;

class HillClimbScene extends Phaser.Scene {
  constructor() { super("HillClimb"); }

  create() {
    this.vehicleType = validVehicle(readSetting("hillclimb-vehicle", "car"));
    this.bestDistance = readBest(this.vehicleType);
    this.distance = 0;
    this.deadTimer = 0;
    this.groundGrace = 0;
    this.saveTimer = 0;
    this.hasStarted = false;
    this.finished = false;
    this.menuOpen = false;
    this.contacts = { grounded: false, bodyHit: false };
    this.terrainBodies = [];
    this.matter.world.setBounds(-500, -1200, WORLD_WIDTH + 1000, 3000, 64, true, true, false, true);
    this.createBackground();
    this.createTerrain();
    this.vehicle = createVehicle(this, this.vehicleType, START_X, this.terrainY(START_X));
    this.cameras.main.setBounds(-400, -600, WORLD_WIDTH + 800, 2400);
    this.followVehicle();
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({ left: "A", right: "D" });
    this.ui = createInterface(this);
    this.onRestart = e => { if (!e.repeat && !this.menuOpen) this.startRun(this.vehicleType); };
    this.onGarage = e => { if (!e.repeat) this.menuOpen ? this.closeGarage() : this.openGarage(); };
    this.onEscape = e => { if (!e.repeat) this.menuOpen ? this.closeGarage() : this.openGarage(); };
    this.onBlur = () => { this.clearInput(); this.saveBest(); };
    this.input.keyboard.on("keydown-R", this.onRestart);
    this.input.keyboard.on("keydown-V", this.onGarage);
    this.input.keyboard.on("keydown-ESC", this.onEscape);
    this.matter.world.on("beforeupdate", this.physicsInput, this);
    this.matter.world.on("afterupdate", this.afterPhysics, this);
    this.scale.on("resize", this.followVehicle, this);
    window.addEventListener("blur", this.onBlur);
    window.addEventListener("pagehide", this.onBlur);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.ui.update(0, this.bestDistance, this.vehicleType);
    this.openGarage();
  }

  terrainY(x) {
    const difficulty = Phaser.Math.Clamp((x - 5000) / 13000, 0, 1);
    return 560 + Math.sin(x * 0.0024) * 82 + Math.sin(x * 0.0062 + 1.2) * 42
      + Math.sin(x * 0.014 + 0.6) * 13 + Math.sin(x * 0.0105 + 2.1) * 60 * difficulty;
  }

  createBackground() {
    this.cameras.main.setBackgroundColor("#9ed8ff");
    const clouds = this.add.graphics().setScrollFactor(0.15);
    clouds.fillStyle(0xffffff, 0.72);
    for (let i = 0; i < 18; i++) {
      const x = i * 900 + 120, y = 90 + (i % 4) * 40;
      clouds.fillCircle(x, y, 42).fillCircle(x + 45, y - 10, 58).fillCircle(x + 95, y + 3, 40);
      clouds.fillRoundedRect(x, y, 110, 55, 20);
    }
    const mountains = this.add.graphics().setScrollFactor(0.35);
    mountains.fillStyle(0x6fa67a, 0.55);
    for (let i = 0; i < 28; i++) {
      const x = i * 700 - 200;
      mountains.fillTriangle(x, 850, x + 350, 330 + Math.sin(i * 1.9) * 55, x + 700, 850);
    }
  }

  createTerrain() {
    const points = [];
    for (let x = -500; x <= WORLD_WIDTH + 600; x += TERRAIN_STEP) points.push({ x, y: this.terrainY(x) });
    const visual = this.add.graphics();
    visual.fillStyle(0x6c9b49).lineStyle(7, 0x3f6f2b);
    visual.beginPath(); visual.moveTo(points[0].x, 1800); visual.lineTo(points[0].x, points[0].y);
    for (const p of points) visual.lineTo(p.x, p.y);
    visual.lineTo(points.at(-1).x, 1800); visual.closePath(); visual.fillPath();
    visual.beginPath(); visual.moveTo(points[0].x, points[0].y);
    for (const p of points) visual.lineTo(p.x, p.y);
    visual.strokePath();
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i], b = points[i + 1];
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      // Offset along the normal so the collider's top matches the drawn slope.
      this.terrainBodies.push(this.matter.add.rectangle(
        (a.x + b.x) / 2 - Math.sin(angle) * 35,
        (a.y + b.y) / 2 + Math.cos(angle) * 35,
        Math.hypot(b.x - a.x, b.y - a.y) + 4, 70,
        { isStatic: true, angle, friction: 1, restitution: 0, label: "terrain" }
      ));
    }
    for (let x = START_X + 1000; x < WORLD_WIDTH - 700; x += 1000) {
      this.add.text(x, this.terrainY(x) - 52, `${Math.round((x - START_X) / 10)} м`, {
        fontFamily: "Arial", fontStyle: "bold", fontSize: "22px", color: "#fff", stroke: "#2a4d21", strokeThickness: 5
      }).setOrigin(0.5);
    }
  }

  followVehicle() {
    if (!this.vehicle) return;
    this.cameras.main.startFollow(this.vehicle.body.position, true, 0.09, 0.09,
      -Math.min(this.scale.width * 0.17, 180), this.vehicleType === "monowheel" ? 15 : 60);
  }

  clearInput() {
    this.ui?.clear();
    this.input.keyboard.resetKeys();
  }

  saveBest() { saveSetting(`hillclimb-best-${this.vehicleType}`, this.bestDistance); }

  openGarage() {
    this.saveBest(); this.clearInput();
    this.menuOpen = true;
    this.matter.world.pause();
    this.ui.show();
  }

  closeGarage() {
    if (!this.hasStarted || this.finished) return;
    this.clearInput(); this.menuOpen = false;
    this.ui.hide(); this.matter.world.resume();
  }

  startRun(type) {
    this.saveBest(); this.clearInput();
    this.cameras.main.stopFollow();
    destroyVehicle(this, this.vehicle);
    this.vehicleType = validVehicle(type);
    saveSetting("hillclimb-vehicle", this.vehicleType);
    this.bestDistance = readBest(this.vehicleType);
    this.vehicle = createVehicle(this, this.vehicleType, START_X, this.terrainY(START_X));
    this.deadTimer = 0; this.distance = 0; this.groundGrace = 0;
    this.contacts = { grounded: false, bodyHit: false };
    this.finished = false; this.hasStarted = true;
    this.followVehicle();
    this.closeGarage();
    this.ui.update(0, this.bestDistance, this.vehicleType);
  }

  physicsInput(event) {
    if (this.menuOpen || this.finished || !this.vehicle) return;
    const delta = Math.min(event.delta || 1000 / 60, 1000 / 30);
    this.groundGrace = this.contacts.grounded ? 100 : Math.max(0, this.groundGrace - delta);
    const left = this.cursors.left.isDown || this.keys.left.isDown;
    const right = this.cursors.right.isDown || this.keys.right.isDown;
    const input = Phaser.Math.Clamp(Number(right) - Number(left) + this.ui.throttle, -1, 1);
    driveVehicle(this.vehicle, this.deadTimer > 0 ? 0 : input, delta, this.groundGrace > 0);
  }

  afterPhysics() {
    if (!this.vehicle) return;
    this.contacts = getContacts(this, this.vehicle);
    drawVehicle(this.vehicle);
  }

  update(_, delta) {
    if (this.menuOpen || this.finished || !this.vehicle) return;
    const body = this.vehicle.body;
    this.distance = Math.max(0, Math.floor((body.position.x - START_X) / 10));
    this.bestDistance = Math.max(this.bestDistance, this.distance);
    this.saveTimer += delta;
    if (this.saveTimer > 1000) { this.saveBest(); this.saveTimer = 0; }
    const angle = Phaser.Math.Angle.Wrap(body.angle);
    const fallen = this.vehicleType === "monowheel"
      ? this.contacts.bodyHit || (this.contacts.grounded && Math.abs(angle) > 1.2)
      : (this.contacts.bodyHit || this.contacts.grounded) && Math.cos(angle) < -0.45;
    const outside = body.position.y > this.terrainY(body.position.x) + 350 || body.position.x < -300;
    this.deadTimer = fallen || outside ? this.deadTimer + Math.min(delta, 100) : 0;
    if (this.deadTimer > 1400) { this.startRun(this.vehicleType); return; }
    let status = this.deadTimer > 200 ? "Упали! Сейчас попробуем ещё раз…" : "";
    if (body.position.x >= WORLD_WIDTH - 700) {
      this.finished = true; this.saveBest(); this.clearInput(); this.matter.world.pause();
      status = "Финиш! Нажми «Заново» или выбери другой транспорт.";
    }
    this.ui.update(this.distance, this.bestDistance, this.vehicleType, status);
  }

  cleanup() {
    this.saveBest();
    window.removeEventListener("blur", this.onBlur);
    window.removeEventListener("pagehide", this.onBlur);
    this.scale.off("resize", this.followVehicle, this);
    this.matter.world.off("beforeupdate", this.physicsInput, this);
    this.matter.world.off("afterupdate", this.afterPhysics, this);
    this.input.keyboard.off("keydown-R", this.onRestart);
    this.input.keyboard.off("keydown-V", this.onGarage);
    this.input.keyboard.off("keydown-ESC", this.onEscape);
    this.ui.destroy();
  }
}

document.documentElement.lang = "ru";
const game = new Phaser.Game({
  type: Phaser.AUTO, parent: "game", backgroundColor: "#9ed8ff", width: 1280, height: 720,
  scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: "matter", matter: { gravity: { y: 1.05 }, positionIterations: 8, velocityIterations: 8, constraintIterations: 4, debug: false } },
  scene: HillClimbScene
});
// Opt-in test access, absent during ordinary play.
if (new URLSearchParams(location.search).has("test")) window.__hillClimb = game;
