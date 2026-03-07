import type { GameConfig } from '../../../lib/types';

// ══════════════════════════════════════════════════════════════════════════════
//  TOP-DOWN TEMPLATE (4-direction — hero dodges enemies from above)
// ══════════════════════════════════════════════════════════════════════════════
function startTopDownGame(config: GameConfig) {
  class TopDownScene extends Phaser.Scene {
    // Allow dynamic property assignment in create() — standard Phaser JS→TS pattern
    [key: string]: any;
    constructor() { super({ key: 'TopDownScene' }); }

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
      var W = this.cameras.main.width;
      var H = this.cameras.main.height;

      this.W = W; this.H = H;
      this.heroX = W / 2;
      this.heroY = H / 2;
      this.enemies = [];       // {x, y, obj}
      this.score = 0;
      this.isGameOver = false;
      this.lastSpawn = 0;
      this.pointerTarget = null; // {x, y} for touch movement
      this.sounds = createSounds();
      ActionSystem.init(this);

      // ── Background ───────────────────────────────────────────────────────
      if (config.bgId && this.textures.exists('bg-tile')) {
        this.add.tileSprite(W / 2, H / 2, W, H, 'bg-tile').setOrigin(0.5).setDepth(-2);
      }

      // Arena border (semi-transparent overlay so it shows above any bg tile)
      this.add.rectangle(W / 2, H / 2, W - 8, H - 8, 0xffffff, 0)
        .setStrokeStyle(3, 0xffffff, 0.35).setDepth(0);

      // ── Hero (sprite or emoji) ────────────────────────────────────────────
      var useHeroSpr = config.heroSpriteId && this.textures.exists('hero-spr');
      if (useHeroSpr) {
        this.heroObj = this.add.image(this.heroX, this.heroY, 'hero-spr')
          .setDisplaySize(52, 52).setOrigin(0.5).setDepth(2);
      } else {
        this.heroObj = this.add.text(this.heroX, this.heroY, config.heroEmoji, {
          fontSize: '52px', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(2);
      }
      this.useHeroSpr = useHeroSpr;
      this.useEnemySpr = config.enemySpriteId && this.textures.exists('enemy-spr');

      // Score + title
      var hasCollectibleInit = (config.actions || []).some(function(a){ return a.type === 'collectible'; });
      this.scoreTxt = this.add.text(W - 20, 20, hasCollectibleInit ? 'Score: 0' : 'Time: 0s', {
        fontSize: '24px', color: '#fff', stroke: '#000', strokeThickness: 4,
      }).setOrigin(1, 0).setDepth(5);

      this.add.text(20, 20, config.title || 'Game!', {
        fontSize: '22px', color: '#fff', stroke: '#000', strokeThickness: 4,
      }).setDepth(5);

      // Keyboard
      this.cursors = this.input.keyboard!.createCursorKeys();
      this.wasd = this.input.keyboard!.addKeys('W,A,S,D');

      // Touch/pointer: hold to move toward pointer
      this.input.on('pointerdown', (ptr: any) => { this.pointerTarget = { x: ptr.x, y: ptr.y }; });
      this.input.on('pointermove', (ptr: any) => {
        if (ptr.isDown) this.pointerTarget = { x: ptr.x, y: ptr.y };
      });
      this.input.on('pointerup', () => { this.pointerTarget = null; });

      // Start hint
      var hint = this.add.text(W / 2, H * 0.88, 'Arrow keys / WASD or tap to move!', {
        fontSize: '22px', color: '#fff', stroke: '#000', strokeThickness: 4,
        backgroundColor: '#0008', padding: { x: 14, y: 6 },
      }).setOrigin(0.5).setDepth(10);
      this.time.delayedCall(2500, () => { if (hint) hint.setAlpha(0); });

      // Signal to parent page that the game started successfully
      window.parent.postMessage({ type: 'GAME_READY' }, '*');
    }

    update(time: number, delta: number) {
      if (this.isGameOver) return;
      var dt = delta / 1000;
      var speed = ActionSystem.tick(this, time, delta, dt, this.heroX, this.heroY);
      var W = this.W, H = this.H;

      // ── Hero movement ─────────────────────────────────────────────────────
      var vx = 0, vy = 0;

      if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -1;
      if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  1;
      if (this.cursors.up.isDown    || this.wasd.W.isDown) vy = -1;
      if (this.cursors.down.isDown  || this.wasd.S.isDown) vy =  1;

      // Touch: move toward held pointer point
      if (vx === 0 && vy === 0 && this.pointerTarget) {
        var dx = this.pointerTarget.x - this.heroX;
        var dy = this.pointerTarget.y - this.heroY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 8) { vx = dx / dist; vy = dy / dist; }
      }

      // Normalize diagonal keyboard input
      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }

      this.heroX = Math.max(32, Math.min(W - 32, this.heroX + vx * speed * dt));
      this.heroY = Math.max(32, Math.min(H - 32, this.heroY + vy * speed * dt));
      this.heroObj.setPosition(this.heroX, this.heroY);

      // ── Spawn enemies — progressive difficulty ────────────────────────────
      var elapsed = Math.floor(time / 1000);
      var tdDiff    = (currentConfig && currentConfig.difficulty) || {};
      var tdDecay   = tdDiff.spawnDecay != null ? tdDiff.spawnDecay : 12;  // ms/sec (default 12 → peak at ~2.2 min)
      var tdMin     = tdDiff.spawnMin   != null ? tdDiff.spawnMin   : 600;
      var spawnInterval = Math.max(tdMin, 2200 - elapsed * tdDecay);
      if (time - this.lastSpawn > spawnInterval) {
        this.spawnEnemy(); this.lastSpawn = time;
      }

      // ── Move enemies + collision ──────────────────────────────────────────
      for (var i = this.enemies.length - 1; i >= 0; i--) {
        var e = this.enemies[i];
        var ex = this.heroX - e.x;
        var ey = this.heroY - e.y;
        var edist = Math.sqrt(ex * ex + ey * ey);

        if (edist < 34) {
          if (ActionSystem.handleCollision(this, e.obj)) { this.triggerGameOver(); return; }
        }

        if (edist > 0) {
          e.x += (ex / edist) * speed * 0.7 * dt;
          e.y += (ey / edist) * speed * 0.7 * dt;
          e.obj.setPosition(e.x, e.y);
        }
      }

      // ── Score (time survived + any collectible bonus) ─────────────────────
      var hasCollectible = (config.actions || []).some(function(a){ return a.type === 'collectible'; });
      if (!hasCollectible) this.score = elapsed;
      this.scoreTxt.setText(hasCollectible ? 'Score: ' + this.score : 'Time: ' + elapsed + 's');
      // Ding every 5 seconds
      if (elapsed > 0 && elapsed % 5 === 0 && elapsed !== this.lastScoreSnd) {
        this.lastScoreSnd = elapsed;
        this.sounds.score();
      }
    }

    spawnEnemy() {
      var W = this.W, H = this.H;
      var x: number, y: number;
      var side = Phaser.Math.Between(0, 3);
      if (side === 0)      { x = Phaser.Math.Between(0, W); y = -40; }
      else if (side === 1) { x = W + 40; y = Phaser.Math.Between(0, H); }
      else if (side === 2) { x = Phaser.Math.Between(0, W); y = H + 40; }
      else                 { x = -40; y = Phaser.Math.Between(0, H); }

      var obj: any;
      if (this.useEnemySpr) {
        obj = this.add.image(x, y, 'enemy-spr').setDisplaySize(44, 44).setOrigin(0.5).setDepth(2);
      } else {
        obj = this.add.text(x, y, config.enemyEmoji, {
          fontSize: '44px', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(2);
      }
      this.enemies.push({ x, y, obj });
    }

    triggerGameOver() {
      this.isGameOver = true;
      ActionSystem.destroy();
      this.sounds.gameOver();
      if (this.useHeroSpr) {
        this.heroObj.setTint(0xff4444);
      } else {
        this.heroObj.setText('💥');
      }

      var W = this.W, H = this.H;
      var cx = W / 2, cy = H / 2;

      this.add.rectangle(cx, cy, 380, 210, 0x000000, 0.78).setDepth(20);
      this.add.text(cx, cy - 58, '💀 Game Over!', {
        fontSize: '36px', color: '#ff4444', stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(21);
      var hasCollectGO = (config.actions || []).some(function(a){ return a.type === 'collectible'; });
      this.add.text(cx, cy - 8, hasCollectGO ? 'Score: ' + this.score : 'Survived: ' + this.score + 's', {
        fontSize: '28px', color: '#fff',
      }).setOrigin(0.5).setDepth(21);
      this.add.text(cx, cy + 42, 'Tap or SPACE to play again!', {
        fontSize: '18px', color: '#aaa',
      }).setOrigin(0.5).setDepth(21);

      this.input.keyboard!.once('keydown', () => this.scene.restart());
      this.input.once('pointerdown', () => this.scene.restart());
    }
  }

  game = new Phaser.Game(makePhaserConfig(config.backgroundColor || '#1a1a2e', TopDownScene));
}
