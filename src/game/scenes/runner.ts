import type { GameConfig } from '../../../lib/types';

// ══════════════════════════════════════════════════════════════════════════════
//  RUNNER TEMPLATE (side-scroller — hero jumps over enemies)
// ══════════════════════════════════════════════════════════════════════════════
function startRunnerGame(config: GameConfig) {
  var W = window.innerWidth;
  var H = window.innerHeight;
  var GROUND_Y = H * 0.78;
  var GROUND_HEIGHT = H - GROUND_Y;

  class RunnerScene extends Phaser.Scene {
    // Allow dynamic property assignment in create() — standard Phaser JS→TS pattern
    [key: string]: any;
    constructor() { super({ key: 'RunnerScene' }); }

    // ── Preload sprites when catalog IDs are set ──────────────────────────
    preload() {
      if (config.heroSpriteUrl)  this.load.image('hero-spr',  config.heroSpriteUrl);
      else if (config.heroSpriteId)  this.load.image('hero-spr',  '/assets/characters/' + config.heroSpriteId  + '.svg');
      if (config.enemySpriteUrl) this.load.image('enemy-spr', config.enemySpriteUrl);
      else if (config.enemySpriteId) this.load.image('enemy-spr', '/assets/characters/' + config.enemySpriteId + '.svg');
      if (config.bgUrl)          this.load.image('bg-tile',   config.bgUrl);
      else if (config.bgId)          this.load.image('bg-tile',   '/assets/backgrounds/' + config.bgId         + '.svg');
    }

    create() {
      this.gameOver = false;
      this.score = 0;
      this.spawnTimer = 0;
      this.spawnInterval = 2200;
      this.lastTime = 0;
      this.sounds = createSounds();
      ActionSystem.init(this);

      // ── Background ───────────────────────────────────────────────────────
      var hasBgTile = config.bgId && this.textures.exists('bg-tile');
      if (hasBgTile) {
        this.bgTile = this.add.tileSprite(0, 0, W, H, 'bg-tile').setOrigin(0).setDepth(-2);
      } else {
        this.cameras.main.setBackgroundColor(config.backgroundColor || '#87CEEB');
      }

      // Clouds (decorative — shown even with bg tiles for parallax feel)
      this.clouds = [];
      for (var i = 0; i < 4; i++) {
        var cloud = this.add.text(
          Phaser.Math.Between(0, W),
          Phaser.Math.Between(30, GROUND_Y * 0.4),
          '☁️',
          { fontSize: Phaser.Math.Between(28, 52) + 'px' }
        ).setDepth(-1);
        (cloud as any).speed = Phaser.Math.Between(20, 50);
        this.clouds.push(cloud);
      }

      // Ground
      this.add.rectangle(W / 2, GROUND_Y + GROUND_HEIGHT / 2, W, GROUND_HEIGHT, 0x5a8a5a);
      this.add.rectangle(W / 2, GROUND_Y + 2, W, 4, 0x3d6b3d);

      // ── Hero (sprite or emoji) ────────────────────────────────────────────
      var useHeroSpr = config.heroSpriteId && this.textures.exists('hero-spr');
      if (useHeroSpr) {
        this.hero = this.add.image(120, GROUND_Y - 16, 'hero-spr')
          .setDisplaySize(52, 52).setOrigin(0.5, 1);
      } else {
        this.hero = this.add.text(120, GROUND_Y - 10, config.heroEmoji, {
          fontSize: '52px', fontFamily: 'Arial'
        }).setOrigin(0.5, 1);
      }
      this.useHeroSpr = useHeroSpr;

      this.heroVelocityY = 0;
      this.isJumping = false;
      this.wasJumping = false;
      this.isDucking = false;
      this.jumpForce = config.jumpForce || 580;
      this.gravity = 1400;
      this.enemies = [];
      this.lastArrivalTime = 0;  // arrival-gate: tracks predicted arrival of last spawned enemy
      this.useEnemySpr = config.enemySpriteId && this.textures.exists('enemy-spr');

      // Score + title text
      this.scoreTxt = this.add.text(W - 20, 20, 'Score: 0', {
        fontSize: '24px', color: '#fff', stroke: '#000', strokeThickness: 4,
      }).setOrigin(1, 0);

      this.add.text(20, 20, config.title || 'Game!', {
        fontSize: '22px', color: '#fff', stroke: '#000', strokeThickness: 4,
      });

      // Input — keyboard
      this.input.keyboard!.on('keydown-SPACE', () => this.doJump());
      this.input.keyboard!.on('keydown-UP',    () => this.doJump());
      this.input.keyboard!.on('keydown-DOWN',  () => this.startDuck());
      this.input.keyboard!.on('keyup-DOWN',    () => this.stopDuck());

      // Input — pointer: top half = jump, bottom half = duck (split-screen)
      var self = this;
      this.input.on('pointerdown', function(ptr: any) {
        if (self.gameOver) { self.scene.restart(); return; }
        if (ptr.y < H / 2) self.doJump();
        else                self.startDuck();
      });
      this.input.on('pointerup', function() { self.stopDuck(); });

      // Start hint
      this.startMsg = this.add.text(W / 2, GROUND_Y * 0.5, '⬆ SPACE / tap top to jump  ⬇ DOWN / tap bottom to duck', {
        fontSize: '28px', color: '#fff', stroke: '#000', strokeThickness: 5,
        backgroundColor: '#0008', padding: { x: 16, y: 8 },
      }).setOrigin(0.5).setDepth(10);
      this.time.delayedCall(2000, () => {
        if (this.startMsg) this.startMsg.setAlpha(0);
      });

      // Signal to parent page that the game started successfully
      window.parent.postMessage({ type: 'GAME_READY' }, '*');
    }

    doJump() {
      if (this.gameOver) { this.scene.restart(); return; }
      if (this.isDucking) return; // can't jump while ducking
      if (!this.isJumping) {
        this.heroVelocityY = -(this.jumpForce);
        this.isJumping = true;
        this.sounds.jump();
      }
    }

    startDuck() {
      if (this.isDucking || this.isJumping) return; // can't duck mid-air
      this.isDucking = true;
      this.hero.setScale(1, 0.5);
    }

    stopDuck() {
      if (!this.isDucking) return;
      this.isDucking = false;
      this.hero.setScale(1, 1);
    }

    spawnOneEnemy(speed: number) {
      var groundY = GROUND_Y;
      var diff = (currentConfig && currentConfig.difficulty) || {};

      // Determine actual speed first (needed for arrival prediction)
      var fastChance  = diff.fastEnemyChance != null ? diff.fastEnemyChance : 0.15;
      var speedMult   = Math.random() < fastChance ? 1.5 : 1.0;
      var actualSpeed = speed * speedMult + Phaser.Math.Between(0, 15); // ±15 jitter keeps feel "alive"

      // Arrival gate: ensure player ALWAYS has time to jump before next enemy arrives.
      // Jump time = 2 × jumpForce / gravity = 2 × 580 / 1400 ≈ 0.83s.
      // MIN_GAP = 950ms guarantees a full jump + 120ms buffer between any two arrivals.
      var travelMs       = ((W + 40 - 120) / actualSpeed) * 1000; // time from spawn to hero x
      var predictedArrival = this.time.now + travelMs;
      if (predictedArrival - this.lastArrivalTime < 950) return; // skip — would be undodgeable
      this.lastArrivalTime = predictedArrival;

      // Roll for low obstacle (duck-required, floats at head height) vs normal (jump-required)
      var lowChance = diff.lowObstacleChance != null ? diff.lowObstacleChance : 0;
      var isLow     = Math.random() < lowChance;

      var enemy: any;
      if (!isLow && this.useEnemySpr) {
        enemy = this.add.image(W + 40, groundY - 16, 'enemy-spr')
          .setDisplaySize(48, 48).setOrigin(0.5, 1);
      } else {
        // Low obstacles spawn at head-height (55px above ground) so they clearly float overhead.
        // Default '🔥' looks like a floating hazard — AI overrides with themed emoji.
        var obstacleEmoji = isLow ? (diff.lowObstacleEmoji || '🔥') : config.enemyEmoji;
        var obstacleY     = isLow ? (groundY - 55) : (groundY - 10);
        enemy = this.add.text(W + 40, obstacleY, obstacleEmoji, {
          fontSize: '48px', fontFamily: 'Arial'
        }).setOrigin(0.5, 1);
      }
      enemy.isLow = isLow; // tag for custom hitbox in collision loop
      enemy.velocityX = -actualSpeed;
      this.enemies.push(enemy);
    }

    update(time: number, delta: number) {
      if (this.gameOver) return;
      var dt = delta / 1000;
      var groundY = GROUND_Y;
      var speed = ActionSystem.tick(this, time, delta, dt, this.hero.x, this.hero.y);

      // Scroll background tile (parallax)
      if (this.bgTile) this.bgTile.tilePositionX += speed * 0.3 * dt;

      // Clouds
      this.clouds.forEach(function(c: any) { c.x -= c.speed * dt; if (c.x < -80) c.x = W + 80; });

      // Hero physics
      this.wasJumping = this.isJumping;
      this.heroVelocityY += this.gravity * dt;
      this.hero.y += this.heroVelocityY * dt;
      if (this.hero.y >= groundY - 10) {
        this.hero.y = groundY - 10;
        this.heroVelocityY = 0;
        if (this.wasJumping) this.sounds.land();
        this.isJumping = false;
      }

      // Spawn enemies — progressive difficulty
      this.spawnTimer += delta;
      if (this.spawnTimer >= this.spawnInterval) {
        this.spawnTimer = 0;
        // Interval shrinks over time; jitter ±25% breaks metronomic rhythm
        var diff = (currentConfig && currentConfig.difficulty) || {};
        var spawnDecay = diff.spawnDecay != null ? diff.spawnDecay : 8;   // ms/sec
        var spawnMin   = diff.spawnMin   != null ? diff.spawnMin   : 900;  // floor ms
        var spawnBase  = Math.max(spawnMin, 2200 - (time / 1000) * spawnDecay);
        this.spawnInterval = Phaser.Math.Between(spawnBase * 0.75, spawnBase * 1.25);
        // Baked-in speed ramp — always active, no config needed.
        // +20px/s per 30 seconds, capped at +200px/s (~4.5× the default start speed).
        var bakedRamp = Math.min(200, Math.floor(time / 30000) * 20);
        var spawnSpeed = Math.min(600, speed + bakedRamp);
        this.spawnOneEnemy(spawnSpeed);
        // Burst: occasional quick follow-up enemy breaks the rhythm further
        var burstChance = diff.burstChance != null ? diff.burstChance : 0.2;
        if (Math.random() < burstChance) {
          var self = this;
          this.time.delayedCall(Phaser.Math.Between(350, 600), function() {
            if (!self.gameOver) self.spawnOneEnemy(spawnSpeed);
          });
        }
      }

      // Move enemies + collision
      var heroBox = this.isDucking
        ? { x: this.hero.x - 20, y: this.hero.y - 22, w: 40, h: 22 }
        : { x: this.hero.x - 18, y: this.hero.y - 44, w: 36, h: 44 };
      for (var i = this.enemies.length - 1; i >= 0; i--) {
        var e = this.enemies[i];
        e.x += e.velocityX * dt;
        if (e.x < -60) {
          e.destroy(); this.enemies.splice(i, 1);
          this.score++;
          this.scoreTxt.setText('Score: ' + this.score);
          if (this.score % 10 === 0) this.sounds.score();
          continue;
        }
        // Low obstacles use a fixed-world-Y hitbox at head height.
        // eBox.bottom = GROUND_Y-44: standing hero top (GROUND_Y-54) hits it;
        // ducking hero top (GROUND_Y-32) clears it. Normal enemies use e.y-relative box.
        var eBox = e.isLow
          ? { x: e.x - 22, y: GROUND_Y - 70, w: 44, h: 26 }  // bottom = GROUND_Y-44
          : { x: e.x - 16, y: e.y - 40, w: 32, h: 40 };
        if (heroBox.x < eBox.x + eBox.w && heroBox.x + heroBox.w > eBox.x &&
            heroBox.y < eBox.y + eBox.h && heroBox.y + heroBox.h > eBox.y) {
          if (ActionSystem.handleCollision(this, e)) { this.triggerGameOver(); return; }
        }
      }
    }

    triggerGameOver() {
      this.gameOver = true;
      ActionSystem.destroy();
      this.sounds.gameOver();
      if (this.useHeroSpr) {
        // Tint the sprite red on game over
        this.hero.setTint(0xff4444);
      } else {
        this.hero.setText('💥');
      }
      var W2 = window.innerWidth, H2 = window.innerHeight;
      this.add.rectangle(W2 / 2, H2 / 2, 360, 200, 0x000000, 0.75).setDepth(20);
      this.add.text(W2 / 2, H2 / 2 - 50, '💀 Game Over!', {
        fontSize: '36px', color: '#ff4444', stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(21);
      this.add.text(W2 / 2, H2 / 2, 'Score: ' + this.score, {
        fontSize: '28px', color: '#fff',
      }).setOrigin(0.5).setDepth(21);
      this.add.text(W2 / 2, H2 / 2 + 48, 'Tap or SPACE to play again!', {
        fontSize: '18px', color: '#aaa',
      }).setOrigin(0.5).setDepth(21);
    }
  }

  game = new Phaser.Game(makePhaserConfig(config.backgroundColor || '#87CEEB', RunnerScene));
}
