import Phaser from "phaser";
import "./style.css";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const WORLD_WIDTH = 22000;
const GROUND_BASE_Y = 560;
const TERRAIN_STEP = 90;

class HillClimbScene extends Phaser.Scene {
  constructor() {
    super("HillClimb");
    this.car = null;
    this.wheels = [];
    this.constraints = [];
    this.terrainBodies = [];
    this.distanceText = null;
    this.bestText = null;
    this.hintText = null;
    this.cursors = null;
    this.keys = null;
    this.touchLeft = false;
    this.touchRight = false;
    this.startX = 260;
    this.startY = 360;
    this.bestDistance = Number(localStorage.getItem("hillclimb-best") || 0);
    this.deadTimer = 0;
  }

  create() {
    this.matter.world.setBounds(-1000, -1500, WORLD_WIDTH + 2000, 3000, 64, true, true, false, true);
    this.matter.world.engine.gravity.y = 1.05;

    this.createBackground();
    this.createTerrain();
    this.createCar(this.startX, this.startY);
    this.createControls();
    this.createHud();

    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, GAME_HEIGHT);
    // A Matter body stores x/y on position, not directly on the body.
    this.cameras.main.startFollow(this.car.position, true, 0.08, 0.08, -180, 70);
    this.cameras.main.setDeadzone(250, 170);

    this.scale.on("resize", () => {
      this.positionTouchButtons();
    });

    this.input.keyboard.on("keydown-R", () => this.restartCar());
  }

  createBackground() {
    this.cameras.main.setBackgroundColor("#9ed8ff");

    const g = this.add.graphics();
    g.setScrollFactor(0.15);
    g.fillStyle(0xffffff, 0.72);

    for (let i = 0; i < 18; i++) {
      const x = i * 900 + 120;
      const y = 90 + (i % 4) * 40;
      g.fillCircle(x, y, 42);
      g.fillCircle(x + 45, y - 10, 58);
      g.fillCircle(x + 95, y + 3, 40);
      g.fillRoundedRect(x, y, 110, 55, 20);
    }

    const mountains = this.add.graphics().setScrollFactor(0.35);
    mountains.fillStyle(0x6fa67a, 0.55);
    for (let i = 0; i < 28; i++) {
      const x = i * 700 - 200;
      const peak = 330 + Math.sin(i * 1.9) * 55;
      mountains.fillTriangle(x, 620, x + 350, peak, x + 700, 620);
    }
  }

  terrainY(x) {
    const gentle = Math.sin(x * 0.0024) * 82;
    const medium = Math.sin(x * 0.0062 + 1.2) * 42;
    const bumps = Math.sin(x * 0.014 + 0.6) * 13;
    const difficulty = Phaser.Math.Clamp((x - 5000) / 13000, 0, 1);
    const harder = Math.sin(x * 0.0105 + 2.1) * 60 * difficulty;
    return GROUND_BASE_Y + gentle + medium + bumps + harder;
  }

  createTerrain() {
    const points = [];
    for (let x = -400; x <= WORLD_WIDTH + 400; x += TERRAIN_STEP) {
      points.push({ x, y: this.terrainY(x) });
    }

    const visual = this.add.graphics();
    visual.fillStyle(0x6c9b49, 1);
    visual.lineStyle(7, 0x3f6f2b, 1);

    visual.beginPath();
    visual.moveTo(points[0].x, GAME_HEIGHT + 300);
    visual.lineTo(points[0].x, points[0].y);
    for (const p of points) visual.lineTo(p.x, p.y);
    visual.lineTo(points[points.length - 1].x, GAME_HEIGHT + 300);
    visual.closePath();
    visual.fillPath();

    visual.beginPath();
    visual.moveTo(points[0].x, points[0].y);
    for (const p of points) visual.lineTo(p.x, p.y);
    visual.strokePath();

    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);
      const body = this.matter.add.rectangle(
        (a.x + b.x) / 2,
        (a.y + b.y) / 2 + 34,
        len + 6,
        70,
        {
          isStatic: true,
          angle,
          friction: 1.2,
          restitution: 0,
          label: "terrain"
        }
      );
      this.terrainBodies.push(body);
    }

    for (let x = 1000; x < WORLD_WIDTH; x += 1100) {
      this.add
        .text(x, this.terrainY(x) - 58, `${Math.floor(x / 100)}m`, {
          fontFamily: "Arial Black, Arial",
          fontSize: "22px",
          color: "#ffffff",
          stroke: "#2a4d21",
          strokeThickness: 5
        })
        .setOrigin(0.5);
    }
  }

  createCar(x, y) {
    const Matter = Phaser.Physics.Matter.Matter;

    const chassis = this.matter.add.rectangle(x, y, 128, 42, {
      chamfer: { radius: 12 },
      friction: 0.7,
      frictionAir: 0.018,
      density: 0.0027,
      restitution: 0.05,
      label: "chassis"
    });

    const wheelA = this.matter.add.circle(x - 48, y + 43, 27, {
      friction: 1.5,
      frictionStatic: 2,
      frictionAir: 0.025,
      density: 0.003,
      restitution: 0,
      label: "wheel"
    });

    const wheelB = this.matter.add.circle(x + 48, y + 43, 27, {
      friction: 1.5,
      frictionStatic: 2,
      frictionAir: 0.025,
      density: 0.003,
      restitution: 0,
      label: "wheel"
    });

    const suspension = {
      stiffness: 0.72,
      damping: 0.16,
      length: 46
    };

    const c1 = Matter.Constraint.create({
      bodyA: chassis,
      pointA: { x: -48, y: 21 },
      bodyB: wheelA,
      ...suspension
    });

    const c2 = Matter.Constraint.create({
      bodyA: chassis,
      pointA: { x: 48, y: 21 },
      bodyB: wheelB,
      ...suspension
    });

    this.matter.world.add([c1, c2]);

    this.car = chassis;
    this.wheels = [wheelA, wheelB];
    this.constraints = [c1, c2];

    this.carGraphics = this.add.graphics();
    this.wheelGraphics = this.add.graphics();

    this.matter.world.on("afterupdate", this.drawCar, this);
  }

  drawCar() {
    if (!this.car || !this.carGraphics || !this.wheelGraphics) return;

    this.carGraphics.clear();
    this.wheelGraphics.clear();

    for (const wheel of this.wheels) {
      this.wheelGraphics.fillStyle(0x20242a, 1);
      this.wheelGraphics.fillCircle(wheel.position.x, wheel.position.y, 28);
      this.wheelGraphics.lineStyle(5, 0xb7c0c7, 1);
      this.wheelGraphics.strokeCircle(wheel.position.x, wheel.position.y, 14);

      const ax = Math.cos(wheel.angle) * 18;
      const ay = Math.sin(wheel.angle) * 18;
      this.wheelGraphics.lineStyle(4, 0xb7c0c7, 1);
      this.wheelGraphics.lineBetween(
        wheel.position.x - ax,
        wheel.position.y - ay,
        wheel.position.x + ax,
        wheel.position.y + ay
      );
    }

    const ctx = this.carGraphics;
    const p = this.car.position;
    const a = this.car.angle;
    const cos = Math.cos(a);
    const sin = Math.sin(a);

    const localToWorld = (lx, ly) => ({
      x: p.x + lx * cos - ly * sin,
      y: p.y + lx * sin + ly * cos
    });

    const corners = [
      localToWorld(-66, -23),
      localToWorld(42, -23),
      localToWorld(66, 5),
      localToWorld(55, 24),
      localToWorld(-62, 24),
      localToWorld(-73, 5)
    ];

    ctx.fillStyle(0xef5b2a, 1);
    ctx.lineStyle(5, 0x7d2610, 1);
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) ctx.lineTo(corners[i].x, corners[i].y);
    ctx.closePath();
    ctx.fillPath();
    ctx.strokePath();

    const cabin = [
      localToWorld(-18, -24),
      localToWorld(8, -50),
      localToWorld(43, -47),
      localToWorld(52, -23)
    ];

    ctx.fillStyle(0xe8f6ff, 1);
    ctx.lineStyle(4, 0x334b5c, 1);
    ctx.beginPath();
    ctx.moveTo(cabin[0].x, cabin[0].y);
    cabin.slice(1).forEach((q) => ctx.lineTo(q.x, q.y));
    ctx.closePath();
    ctx.fillPath();
    ctx.strokePath();

    const driver = localToWorld(14, -38);
    ctx.fillStyle(0xffd2a6, 1);
    ctx.fillCircle(driver.x, driver.y, 10);
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      left: "A",
      right: "D",
      space: "SPACE"
    });

    this.leftButton = this.add
      .circle(90, 620, 58, 0x111111, 0.32)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();

    this.rightButton = this.add
      .circle(220, 620, 58, 0x111111, 0.32)
      .setScrollFactor(0)
      .setDepth(1000)
      .setInteractive();

    this.leftLabel = this.add
      .text(90, 620, "◀", { fontSize: "44px", color: "#fff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);

    this.rightLabel = this.add
      .text(220, 620, "▶", { fontSize: "44px", color: "#fff" })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1001);

    const bind = (button, setter) => {
      button.on("pointerdown", () => setter(true));
      button.on("pointerup", () => setter(false));
      button.on("pointerout", () => setter(false));
    };

    bind(this.leftButton, (v) => (this.touchLeft = v));
    bind(this.rightButton, (v) => (this.touchRight = v));

    this.input.on("pointerup", () => {
      this.touchLeft = false;
      this.touchRight = false;
    });

    this.positionTouchButtons();
  }

  positionTouchButtons() {
    if (!this.leftButton) return;
    const h = this.scale.height;
    const y = h - 88;
    this.leftButton.setPosition(90, y);
    this.rightButton.setPosition(220, y);
    this.leftLabel.setPosition(90, y);
    this.rightLabel.setPosition(220, y);
  }

  createHud() {
    this.distanceText = this.add
      .text(24, 22, "0 m", {
        fontFamily: "Arial Black, Arial",
        fontSize: "36px",
        color: "#ffffff",
        stroke: "#1b3442",
        strokeThickness: 7
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.bestText = this.add
      .text(26, 66, `BEST ${this.bestDistance} m`, {
        fontFamily: "Arial",
        fontStyle: "bold",
        fontSize: "19px",
        color: "#ffffff",
        stroke: "#1b3442",
        strokeThickness: 4
      })
      .setScrollFactor(0)
      .setDepth(1000);

    this.hintText = this.add
      .text(this.scale.width - 24, 24, "A/D or ←/→   •   R restart", {
        fontFamily: "Arial",
        fontStyle: "bold",
        fontSize: "18px",
        color: "#ffffff",
        stroke: "#1b3442",
        strokeThickness: 4
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(1000);
  }

  restartCar() {
    this.matter.world.off("afterupdate", this.drawCar, this);

    if (this.car) this.matter.world.remove(this.car);
    for (const wheel of this.wheels) this.matter.world.remove(wheel);
    for (const constraint of this.constraints) this.matter.world.remove(constraint);

    this.carGraphics?.destroy();
    this.wheelGraphics?.destroy();

    const x = Math.max(this.startX, Math.min(this.car?.position?.x || this.startX, WORLD_WIDTH - 1000));
    const spawnX = Math.max(this.startX, x - 160);
    const spawnY = this.terrainY(spawnX) - 150;

    this.createCar(spawnX, spawnY);
    this.cameras.main.startFollow(this.car.position, true, 0.08, 0.08, -180, 70);
    this.deadTimer = 0;
  }

  update(_, delta) {
    if (!this.car) return;

    const Matter = Phaser.Physics.Matter.Matter;
    const left = this.cursors.left.isDown || this.keys.left.isDown || this.touchLeft;
    const right = this.cursors.right.isDown || this.keys.right.isDown || this.touchRight;

    const speed = this.car.velocity.x;
    const maxSpeed = 15;
    const wheelTorque = 0.042;

    if (right) {
      for (const wheel of this.wheels) {
        Matter.Body.setAngularVelocity(
          wheel,
          Phaser.Math.Clamp(wheel.angularVelocity + wheelTorque, -0.48, 0.48)
        );
      }
      if (speed < maxSpeed) {
        Matter.Body.applyForce(this.car, this.car.position, { x: 0.00016, y: 0 });
      }
    }

    if (left) {
      for (const wheel of this.wheels) {
        Matter.Body.setAngularVelocity(
          wheel,
          Phaser.Math.Clamp(wheel.angularVelocity - wheelTorque, -0.48, 0.48)
        );
      }
      if (speed > -7) {
        Matter.Body.applyForce(this.car, this.car.position, { x: -0.00011, y: 0 });
      }
    }

    const airborneControl = 0.0007;
    if (right && !left) Matter.Body.setAngularVelocity(this.car, this.car.angularVelocity + airborneControl);
    if (left && !right) Matter.Body.setAngularVelocity(this.car, this.car.angularVelocity - airborneControl);

    const distance = Math.max(0, Math.floor((this.car.position.x - this.startX) / 10));
    this.distanceText.setText(`${distance} m`);

    if (distance > this.bestDistance) {
      this.bestDistance = distance;
      localStorage.setItem("hillclimb-best", String(distance));
      this.bestText.setText(`BEST ${distance} m`);
    }

    const terrainHere = this.terrainY(this.car.position.x);
    const upsideDown = Math.cos(this.car.angle) < -0.45;
    const tooLow = this.car.position.y > terrainHere + 350;
    const tooFarLeft = this.car.position.x < -300;

    if (upsideDown || tooLow || tooFarLeft) {
      this.deadTimer += delta;
      if (this.deadTimer > 1700) this.restartCar();
    } else {
      this.deadTimer = 0;
    }

    if (this.car.position.x > WORLD_WIDTH - 700) {
      this.hintText.setText("FINISH!  •  Press R to drive again");
    }
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#9ed8ff",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 320,
      height: 480
    }
  },
  physics: {
    default: "matter",
    matter: {
      gravity: { y: 1.05 },
      debug: false
    }
  },
  scene: HillClimbScene
};

new Phaser.Game(config);
