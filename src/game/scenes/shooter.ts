import type { GameConfig } from '../../../lib/types';

// ══════════════════════════════════════════════════════════════════════════════
//  SHOOTER TEMPLATE (top-down paintball — player shoots enemies, AI shoots back)
// ══════════════════════════════════════════════════════════════════════════════
function startShooterGame(config: GameConfig) {
  var SC             = config.shooter || {};
  var WALL_COUNT     = Math.max(2,   Math.min(16,   SC.wallCount        || 6));
  var HERO_HP        = Math.max(1,   Math.min(5,    SC.heroHp           || 3));
  var ENEMY_HP       = Math.max(1,   Math.min(4,    SC.enemyHp          || 2));
  var FIRE_RATE      = Math.max(200, Math.min(1200, SC.fireRate         || 500));
  var ENEMY_FR_BASE  = Math.max(800, Math.min(4000, SC.enemyFireRate    || 2000));
  var MAX_ENEMIES    = Math.max(2,   Math.min(8,    SC.maxEnemies       || 4));
  var PROJ_SPEED     = Math.max(200, Math.min(700,  SC.projectileSpeed  || 450));
  // ── Visual / sizing config ───────────────────────────────────────────────
  var ARENA_SCALE    = Math.max(0.6, Math.min(1.4, SC.arenaScale    || 1.0));
  var WALL_THICK     = Math.max(10,  Math.min(40,  SC.wallThickness || 20));
  var ENTITY_SCALE   = Math.max(0.7, Math.min(1.5, SC.entityScale   || 1.0));
  var FLOOR_TILE     = Math.max(24,  Math.min(96,  SC.floorTile     || 56));
  var WALL_STYLE: string = SC.wallStyle || 'box';
  var HERO_RADIUS    = Math.round(18 * ENTITY_SCALE);
  var ENEMY_RADIUS   = Math.round(18 * ENTITY_SCALE);
  var BULLET_RADIUS  = Math.max(4, Math.round(6 * ENTITY_SCALE));
  var HERO_SPEED     = Math.max(150, Math.min(400,  config.speed        || 220));
  // ── Grenade + Fog config ─────────────────────────────────────────────────
  var GRENADE_TYPE   = SC.grenadeType   || null;
  var GRENADE_COUNT  = (SC.grenadeCount !== undefined) ? SC.grenadeCount : 3;
  var GRENADE_CD     = Math.max(500, SC.grenadeCooldown || 3000);
  var FOG_OF_WAR     = SC.fogOfWar === true;
  var FOG_RADIUS     = Math.max(60, Math.min(300, SC.fogRadius || 180));
  // ── New building-block constants ─────────────────────────────────────────
  var HEALTH_PICKUPS   = SC.healthPickups  !== false;
  var GRENADE_PICKUPS  = !!(GRENADE_TYPE && SC.grenadePickups !== false);
  var WEAPON_PICKUPS   = SC.weaponPickups  === true;
  var ENEMY_GRENADES   = !!(GRENADE_TYPE && SC.enemyGrenades  === true);
  var ENEMY_GRENADE_CD = 5000; // ms between enemy grenade throws
  var GAME_MODE        = SC.gameMode || 'deathmatch';
  var ENEMY_TYPES      = (SC.enemyTypes && SC.enemyTypes.length) ? SC.enemyTypes : ['grunt'];
  var ETYPE_STATS: Record<string, any> = {
    grunt:  { hp: ENEMY_HP,       radius: 16, alertSpd: 95,  patrolMin: 55, patrolMax: 90,  scale: 1.0, tint: -1,       shootsBack: true,  frMult: 1.0 },
    heavy:  { hp: ENEMY_HP * 2,   radius: 20, alertSpd: 65,  patrolMin: 35, patrolMax: 50,  scale: 1.3, tint: 0xcc8844, shootsBack: true,  frMult: 1.5 },
    scout:  { hp: 1,              radius: 13, alertSpd: 140, patrolMin: 80, patrolMax: 110, scale: 0.8, tint: -1,       shootsBack: false, frMult: 1.0 },
    sniper: { hp: ENEMY_HP + 1,   radius: 16, alertSpd: 50,  patrolMin: 30, patrolMax: 50,  scale: 1.0, tint: 0x8888ff, shootsBack: true,  frMult: 0.5 },
  };

  class ShooterScene extends Phaser.Scene {
    // Allow dynamic property assignment in create() — standard Phaser JS→TS pattern
    [key: string]: any;
    constructor() { super({ key: 'ShooterScene' }); }

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

      this.isGameOver           = false;
      this.score                = 0;
      this.heroHp               = HERO_HP;
      this.isInvincible         = false;
      this.lastShot             = 0;
      this.walls                = [];   // { x, y, w, h, obj }
      this.bullets              = [];   // { x, y, vx, vy, fromEnemy, obj }
      this.enemies              = [];   // { x, y, hp, maxHp, state, patrolZone, patrolDir, patrolAxis, patrolSpeed, shootTimer, lastFacingX, lastFacingY, blindedUntil, obj }
      this.grenades             = [];   // { x, y, vx, vy, fuse, obj, shadow, fromEnemy }
      this.smokeZones           = [];   // { x, y, r, until, obj }
      this.pickups              = [];   // { x, y, type, obj, labelObj, respawnAt }
      this.weaponPickupObjs     = [];   // { x, y, weaponId, obj, labelObj, respawnAt }
      this.grenadeAmmo          = (GRENADE_COUNT === 0) ? Infinity : GRENADE_COUNT;
      this.lastGrenade          = 0;
      this.slowUntil            = 0;
      this.heroDisorientedUntil = 0;
      this.currentWeapon        = 'pistol';
      this.currentFireRate      = FIRE_RATE;
      this.rampTimer            = 0;
      this.currentEnemyFireRate = ENEMY_FR_BASE;
      this.currentMaxEnemies    = MAX_ENEMIES;
      this.lastFacingX          = 1;
      this.lastFacingY          = 0;
      this.pointerDown          = false;
      this.tapStartTime         = 0;
      this.pointerTarget        = null;
      this.sounds               = createSounds();

      // ── Background ──────────────────────────────────────────────────────
      if ((config.bgId || config.bgUrl) && this.textures.exists('bg-tile')) {
        this.add.tileSprite(W/2, H/2, W, H, 'bg-tile').setOrigin(0.5).setDepth(-2);
      } else {
        this.cameras.main.setBackgroundColor(config.backgroundColor || '#2d4a2d');
        // Subtle checkerboard floor — alternating tiles +22 brightness
        var tileSize = FLOOR_TILE;
        var floorG = this.add.graphics().setDepth(-1);
        var bgRaw = (config.backgroundColor || '#2d4a2d').replace('#','');
        while (bgRaw.length < 6) bgRaw = '0' + bgRaw;
        var fr=parseInt(bgRaw.slice(0,2),16), fgg=parseInt(bgRaw.slice(2,4),16), fbb=parseInt(bgRaw.slice(4,6),16);
        var fr2=Math.min(255,fr+22), fg2=Math.min(255,fgg+22), fb2=Math.min(255,fbb+22);
        var altColor=(fr2<<16)|(fg2<<8)|fb2;
        for (var ty=0; ty<H; ty+=tileSize) {
          for (var tx=0; tx<W; tx+=tileSize) {
            if ((Math.floor(tx/tileSize)+Math.floor(ty/tileSize))%2===0) {
              floorG.fillStyle(altColor,1);
              floorG.fillRect(tx,ty,tileSize,tileSize);
            }
          }
        }
      }
      // Arena border
      this.add.rectangle(W/2, H/2, W-8, H-8, 0xffffff, 0).setStrokeStyle(3, 0xffffff, 0.2).setDepth(0);

      // Apply arena scale (camera zoom)
      if (ARENA_SCALE !== 1.0) {
        this.cameras.main.setZoom(ARENA_SCALE);
        this.cameras.main.centerOn(W/2, H/2);
      }

      // Derive wall color from backgroundColor (darker tint)
      var bgHex = (config.backgroundColor || '#2d4a2d').replace('#', '');
      while (bgHex.length < 6) bgHex = '0' + bgHex;
      var rr = Math.max(0, parseInt(bgHex.slice(0,2), 16) - 60);
      var gg = Math.max(0, parseInt(bgHex.slice(2,4), 16) - 60);
      var bb = Math.max(0, parseInt(bgHex.slice(4,6), 16) - 60);
      this.wallColor = (rr << 16) | (gg << 8) | bb;

      // ── Game mode (CTF, etc.) — init before walls so bases are reserved ─
      this.modeState = initGameMode(this, SC);
      var modeReserved = this.modeState ? ZoneSystem.getReservedRects() : [];
      this.generateWalls(modeReserved);

      // ── Hero ────────────────────────────────────────────────────────────
      // CTF: start near hero base; default: center
      if (this.modeState && this.modeState.heroBase) {
        var hb = this.modeState.heroBase;
        this.heroX = hb.x + hb.w / 2;
        this.heroY = hb.y + hb.h / 2;
      } else {
        this.heroX = W/2; this.heroY = H/2;
      }
      var heroDispSize = Math.round(44 * ENTITY_SCALE);
      var useHeroSpr = config.heroSpriteId && this.textures.exists('hero-spr');
      if (useHeroSpr) {
        this.heroObj = this.add.image(this.heroX, this.heroY, 'hero-spr').setDisplaySize(heroDispSize,heroDispSize).setOrigin(0.5).setDepth(5);
      } else {
        this.heroObj = this.add.text(this.heroX, this.heroY, config.heroEmoji || '🧑', {
          fontSize: heroDispSize + 'px', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(5);
      }
      this.useHeroSpr  = useHeroSpr;
      this.useEnemySpr = config.enemySpriteId && this.textures.exists('enemy-spr');

      // ── Gun aim indicator (yellow dot, rendered above hero) ──────────────
      this.heroGunIndicator = this.add.graphics().setDepth(6);

      // ── HP HUD ───────────────────────────────────────────────────────────
      this.hpObjs = [];
      this.buildHpHUD();

      // ── Score + Title ────────────────────────────────────────────────────
      this.scoreTxt = this.add.text(W-20, 20, GAME_MODE === 'ctf' ? 'Kills: 0' : 'Score: 0', {
        fontSize: GAME_MODE === 'ctf' ? '18px' : '24px', color: '#fff', stroke: '#000', strokeThickness: 4,
      }).setOrigin(1,0).setDepth(56);
      this.add.text(20, 20, config.title || 'Paintball!', {
        fontSize: '22px', color: '#fff', stroke: '#000', strokeThickness: 4,
      }).setDepth(56);
      // ── Grenade ammo HUD ─────────────────────────────────────────────────
      if (GRENADE_TYPE) {
        var grenadeIcon = ({ frag: '💣', smoke: '💨', flash: '🔆', slow: '⏱️' } as Record<string,string>)[GRENADE_TYPE] || '💣';
        var grenadeHudY = GAME_MODE === 'ctf' ? 118 : 20;
        this.grenadeTxt = this.add.text(W/2, grenadeHudY,
          grenadeIcon + ' ×' + (this.grenadeAmmo === Infinity ? '∞' : this.grenadeAmmo), {
          fontSize: '20px', color: '#fff', stroke: '#000', strokeThickness: 3,
        }).setOrigin(0.5, 0).setDepth(56);
      }

      // ── Spawn initial enemies by zone ─────────────────────────────────
      this.zones = this.buildZones();
      for (var zi = 0; zi < this.currentMaxEnemies; zi++) {
        this.spawnEnemy(this.zones[zi % this.zones.length]);
      }

      // ── Initial pickups + weapon drops ────────────────────────────────
      if (HEALTH_PICKUPS)  this.spawnInitialPickups('health',  3);
      if (GRENADE_PICKUPS) this.spawnInitialPickups('grenade', 2);
      if (WEAPON_PICKUPS)  this.spawnInitialWeapons();

      // ── Keyboard ─────────────────────────────────────────────────────────
      this.cursors    = this.input.keyboard!.createCursorKeys();
      this.wasd       = this.input.keyboard!.addKeys('W,A,S,D');
      this.spaceKey   = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.grenadeKey = GRENADE_TYPE ? this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E) : null;

      // ── Pointer ───────────────────────────────────────────────────────────
      var self = this;
      this.input.on('pointerdown', function(ptr: any) {
        if (self.isGameOver) { self.scene.restart(); return; }
        self.pointerDown  = true;
        self.tapStartTime = self.time.now;
        self.pointerTarget = { x: ptr.x, y: ptr.y };
      });
      this.input.on('pointermove', function(ptr: any) {
        if (ptr.isDown) self.pointerTarget = { x: ptr.x, y: ptr.y };
      });
      this.input.on('pointerup', function(ptr: any) {
        self.pointerDown = false;
        var dur = self.time.now - self.tapStartTime;
        if (dur < 180) self.tryHeroShoot(ptr.x, ptr.y); // quick tap = shoot
        self.pointerTarget = null;
      });

      // ── Fog of war setup ─────────────────────────────────────────────────
      if (FOG_OF_WAR) {
        this.fogGraphics = this.add.graphics().setDepth(52);
        this.fogGraphics.fillStyle(0x000000, 0.88);
        this.fogGraphics.fillRect(0, 0, W, H);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.visionShape = (this.make.graphics as any)({ add: false });
        var fogMask = this.visionShape.createGeometryMask();
        fogMask.invertAlpha = true;
        this.fogGraphics.setMask(fogMask);
      }

      // ── Start hint ────────────────────────────────────────────────────────
      var hintStr = 'WASD/arrows move · SPACE/click shoot' + (GRENADE_TYPE ? ' · E throw' : '') + (WEAPON_PICKUPS ? ' · walk over weapons' : '') + ' · hold to move on mobile'
        + (GAME_MODE === 'ctf' ? ' · Grab 🚩 and return to 🔵 base!' : '');
      var hint = this.add.text(W/2, H*0.92, hintStr, {
        fontSize: '15px', color: '#fff', stroke: '#000', strokeThickness: 3,
        backgroundColor: '#0009', padding: { x:10, y:5 },
      }).setOrigin(0.5).setDepth(56);
      this.time.delayedCall(3500, function(){ if (hint && hint.active) hint.setAlpha(0); });

      window.parent.postMessage({ type: 'GAME_READY' }, '*');
    }

    // ── Wall generation ─────────────────────────────────────────────────

    generateWalls(reservedRects?: any[]) {
      var W = this.W, H = this.H;
      var clearR = 110;
      var margin  = 50;
      var placedCount = 0;
      var self = this;
      var reserved = reservedRects || [];
      var t = WALL_THICK; // wall thickness
      var ht = Math.round(t / 2);

      function isInReserved(px: number, py: number): boolean {
        for (var ri = 0; ri < reserved.length; ri++) {
          var rr = reserved[ri];
          if (px > rr.x && px < rr.x + rr.w && py > rr.y && py < rr.y + rr.h) return true;
        }
        return false;
      }

      // ── Wall layout algorithms ──────────────────────────────────────────
      if (WALL_STYLE === 'corridor') {
        // Long parallel walls creating lanes
        var laneCount = Math.min(WALL_COUNT, Math.floor(WALL_COUNT / 2) + 1);
        var spacing = H / (laneCount + 1);
        for (var li = 0; li < laneCount && placedCount < WALL_COUNT; li++) {
          var ly = spacing * (li + 1);
          var lw = Phaser.Math.Between(Math.round(W * 0.3), Math.round(W * 0.6));
          var lx = Phaser.Math.Between(margin, W - margin - lw);
          if (Math.abs(ly - H/2) < clearR && Math.abs(lx + lw/2 - W/2) < clearR) continue;
          if (isInReserved(lx + lw/2, ly)) continue;
          self.addWall(lx, ly - ht, lw, t);
          placedCount++;
          // Add perpendicular connectors for remaining count
          if (placedCount < WALL_COUNT && Math.random() < 0.5) {
            var cx = li % 2 === 0 ? lx : lx + lw - t;
            var ch = Phaser.Math.Between(40, 80);
            self.addWall(cx, ly, t, ch);
            placedCount++;
          }
        }
      } else if (WALL_STYLE === 'scattered') {
        // Many small obstacles scattered across the arena
        for (var si = 0; si < WALL_COUNT && placedCount < WALL_COUNT; si++) {
          for (var attempt = 0; attempt < 40; attempt++) {
            var sx = Phaser.Math.Between(margin, W - margin);
            var sy = Phaser.Math.Between(margin, H - margin);
            if (Math.sqrt((sx-W/2)*(sx-W/2)+(sy-H/2)*(sy-H/2)) < clearR) continue;
            if (isInReserved(sx, sy)) continue;
            var sw = Phaser.Math.Between(Math.round(t * 1.5), Math.round(t * 3));
            var sh = Phaser.Math.Between(Math.round(t * 1.5), Math.round(t * 3));
            self.addWall(sx - sw/2, sy - sh/2, sw, sh);
            placedCount++;
            break;
          }
        }
      } else if (WALL_STYLE === 'maze') {
        // Interconnected wall segments forming paths
        var cellW = Math.round(W / 6);
        var cellH = Math.round(H / 5);
        var cells: boolean[][] = [];
        for (var mr = 0; mr < 5; mr++) {
          cells[mr] = [];
          for (var mc = 0; mc < 6; mc++) cells[mr][mc] = false;
        }
        // Randomly activate cells for wall placement
        var mazeSlots = Math.min(WALL_COUNT, 20);
        for (var mi = 0; mi < mazeSlots && placedCount < WALL_COUNT; mi++) {
          var mr2 = Phaser.Math.Between(0, 4);
          var mc2 = Phaser.Math.Between(0, 5);
          if (cells[mr2][mc2]) continue;
          var mx = mc2 * cellW + cellW / 2;
          var my = mr2 * cellH + cellH / 2;
          if (Math.sqrt((mx-W/2)*(mx-W/2)+(my-H/2)*(my-H/2)) < clearR) continue;
          if (isInReserved(mx, my)) continue;
          cells[mr2][mc2] = true;
          // Place H or V segment
          if (Math.random() < 0.5) {
            self.addWall(mx - cellW/2 + 10, my - ht, cellW - 20, t);
          } else {
            self.addWall(mx - ht, my - cellH/2 + 10, t, cellH - 20);
          }
          placedCount++;
        }
      } else {
        // Default 'box' style — original algorithm with configurable thickness

        // Helper: place a random wall cluster at (wx, wy)
        function placeCluster(wx: number, wy: number) {
          var rtype = Phaser.Math.Between(0, 2);
          if (rtype === 0) {
            var rw = Phaser.Math.Between(80, 130);
            self.addWall(wx - rw/2, wy - ht, rw, t);
          } else if (rtype === 1) {
            var rh = Phaser.Math.Between(80, 130);
            self.addWall(wx - ht, wy - rh/2, t, rh);
          } else {
            var aw = Phaser.Math.Between(60, 100);
            var bh = Phaser.Math.Between(50, 90);
            self.addWall(wx - aw/2, wy - ht, aw, t);
            self.addWall(wx - ht,   wy + ht,  t, bh);
          }
        }

        // 1. Center T-shape anchor (when WALL_COUNT >= 4)
        if (WALL_COUNT >= 4) {
          var hw = Phaser.Math.Between(90, 120);
          var vh = Phaser.Math.Between(50, 80);
          self.addWall(W/2 - hw/2, H/2 - 30, hw, t);
          self.addWall(W/2 - ht,   H/2 - ht, t, vh);
          placedCount++;
        }

        // 2. Quadrant anchors (when WALL_COUNT >= 8)
        if (WALL_COUNT >= 8) {
          var quadrants = [
            { x: margin + 10,  y: margin + 10,  w: W/2 - margin - 30, h: H/2 - margin - 30 },
            { x: W/2 + 20,     y: margin + 10,  w: W/2 - margin - 30, h: H/2 - margin - 30 },
            { x: margin + 10,  y: H/2 + 20,     w: W/2 - margin - 30, h: H/2 - margin - 30 },
            { x: W/2 + 20,     y: H/2 + 20,     w: W/2 - margin - 30, h: H/2 - margin - 30 },
          ];
          for (var q = 0; q < quadrants.length && placedCount < WALL_COUNT; q++) {
            var qz = quadrants[q];
            var qx = Phaser.Math.Between(qz.x + 20, qz.x + qz.w - 20);
            var qy = Phaser.Math.Between(qz.y + 20, qz.y + qz.h - 20);
            placeCluster(qx, qy);
            placedCount++;
          }
        }

        // 3. Random fill for remaining
        var remaining = WALL_COUNT - placedCount;
        for (var i = 0; i < remaining; i++) {
          var found = false;
          for (var attempt = 0; attempt < 40 && !found; attempt++) {
            var wx = Phaser.Math.Between(margin, W - margin);
            var wy = Phaser.Math.Between(margin, H - margin);
            if (Math.sqrt((wx-W/2)*(wx-W/2)+(wy-H/2)*(wy-H/2)) < clearR) continue;
            if (isInReserved(wx, wy)) continue;
            placeCluster(wx, wy);
            found = true;
          }
        }
      }
    }

    addWall(x: number, y: number, w: number, h: number) {
      var obj = this.add.rectangle(x + w/2, y + h/2, w, h, this.wallColor).setDepth(3);
      obj.setStrokeStyle(1, 0xffffff, 0.08);
      this.walls.push({ x: x, y: y, w: w, h: h, obj: obj });
    }

    // ── Wall collision resolution ─────────────────────────────────────────
    // Push circle (cx, cy, r) out of any overlapping wall rectangles.

    resolveWallCollision(cx: number, cy: number, r: number) {
      for (var i = 0; i < this.walls.length; i++) {
        var wall = this.walls[i];
        var nearX  = Math.max(wall.x, Math.min(wall.x + wall.w, cx));
        var nearY  = Math.max(wall.y, Math.min(wall.y + wall.h, cy));
        var dx     = cx - nearX;
        var dy     = cy - nearY;
        var distSq = dx*dx + dy*dy;
        if (distSq > 0 && distSq < r*r) {
          var dist = Math.sqrt(distSq);
          cx += (dx/dist) * (r - dist);
          cy += (dy/dist) * (r - dist);
        } else if (distSq === 0) {
          cy -= r; // exact center on edge — push up
        }
      }
      cx = Math.max(r, Math.min(this.W - r, cx));
      cy = Math.max(r, Math.min(this.H - r, cy));
      return { x: cx, y: cy };
    }

    // ── Line-of-sight (parametric segment–AABB slab test) ────────────────
    // Returns TRUE if the segment (x1,y1)→(x2,y2) is unobstructed.

    hasLOS(x1: number, y1: number, x2: number, y2: number) {
      var dx = x2 - x1, dy = y2 - y1;
      // Wall slab test
      for (var i = 0; i < this.walls.length; i++) {
        var w  = this.walls[i];
        var wL = w.x, wR = w.x + w.w, wT = w.y, wB = w.y + w.h;
        var tMin = 0, tMax = 1;
        // X slab
        if (Math.abs(dx) < 0.0001) {
          if (x1 < wL || x1 > wR) continue;
        } else {
          var tx1 = (wL - x1) / dx, tx2 = (wR - x1) / dx;
          if (tx1 > tx2) { var tmp = tx1; tx1 = tx2; tx2 = tmp; }
          tMin = Math.max(tMin, tx1); tMax = Math.min(tMax, tx2);
          if (tMin > tMax) continue;
        }
        // Y slab
        if (Math.abs(dy) < 0.0001) {
          if (y1 < wT || y1 > wB) continue;
        } else {
          var ty1 = (wT - y1) / dy, ty2 = (wB - y1) / dy;
          if (ty1 > ty2) { var tmp2 = ty1; ty1 = ty2; ty2 = tmp2; }
          tMin = Math.max(tMin, ty1); tMax = Math.min(tMax, ty2);
          if (tMin > tMax) continue;
        }
        return false; // blocked by wall
      }
      // Smoke zones block LOS — segment vs circle (point-to-line distance)
      var now = this.time.now;
      var lenSq = dx*dx + dy*dy;
      for (var si = 0; si < this.smokeZones.length; si++) {
        var sz = this.smokeZones[si];
        if (sz.until < now) continue;
        if (lenSq < 0.001) continue;
        var t = Math.max(0, Math.min(1, ((sz.x - x1)*dx + (sz.y - y1)*dy) / lenSq));
        var closestX = x1 + t*dx, closestY = y1 + t*dy;
        var distSq2 = (sz.x - closestX)*(sz.x - closestX) + (sz.y - closestY)*(sz.y - closestY);
        if (distSq2 < sz.r * sz.r) return false; // blocked by smoke
      }
      return true; // clear
    }

    // ── Projectile system ───────────────────────────────────────────────

    spawnBullet(x: number, y: number, vx: number, vy: number, fromEnemy: boolean, damage?: number) {
      // Offset spawn forward so bullet starts outside the shooter's body
      var len = Math.sqrt(vx*vx + vy*vy);
      if (len > 0) {
        var offset = (fromEnemy ? ENEMY_RADIUS : HERO_RADIUS) + BULLET_RADIUS + 2;
        x += (vx/len) * offset;
        y += (vy/len) * offset;
      }
      x = Math.max(BULLET_RADIUS, Math.min(this.W - BULLET_RADIUS, x));
      y = Math.max(BULLET_RADIUS, Math.min(this.H - BULLET_RADIUS, y));
      var color = fromEnemy ? 0xff4433 : 0x33aaff;
      var obj = this.add.circle(x, y, BULLET_RADIUS, color).setDepth(8);
      this.bullets.push({ x: x, y: y, vx: vx, vy: vy, fromEnemy: fromEnemy, damage: damage || 1, obj: obj });
    }

    updateBullets(dt: number) {
      var W = this.W, H = this.H;
      for (var i = this.bullets.length - 1; i >= 0; i--) {
        var b = this.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.obj.setPosition(b.x, b.y);

        // Off-screen
        if (b.x < -20 || b.x > W+20 || b.y < -20 || b.y > H+20) {
          b.obj.destroy(); this.bullets.splice(i, 1); continue;
        }

        // Wall hit
        var hitWall = false;
        for (var wi = 0; wi < this.walls.length; wi++) {
          var w = this.walls[wi];
          if (b.x > w.x && b.x < w.x+w.w && b.y > w.y && b.y < w.y+w.h) {
            hitWall = true; break;
          }
        }
        if (hitWall) {
          this.splatEffect(b.x, b.y, b.fromEnemy ? 0xff4433 : 0x33aaff);
          b.obj.destroy(); this.bullets.splice(i, 1); continue;
        }

        // Hero hit (enemy bullets only)
        if (b.fromEnemy && !this.isInvincible) {
          var hdx = b.x - this.heroX, hdy = b.y - this.heroY;
          var hr = HERO_RADIUS + BULLET_RADIUS;
          if (hdx*hdx + hdy*hdy < hr*hr) {
            this.splatEffect(b.x, b.y, 0xff4433);
            b.obj.destroy(); this.bullets.splice(i, 1);
            this.heroTakeHit();
            if (this.isGameOver) return;
            continue;
          }
        }

        // Enemy hit (hero bullets only)
        if (!b.fromEnemy) {
          var hit = false;
          for (var ei = this.enemies.length - 1; ei >= 0; ei--) {
            var e = this.enemies[ei];
            var edx = b.x - e.x, edy = b.y - e.y;
            var er = (e.radius || ENEMY_RADIUS) + BULLET_RADIUS;
            if (edx*edx + edy*edy < er*er) {
              this.splatEffect(b.x, b.y, 0x44ff88);
              b.obj.destroy(); this.bullets.splice(i, 1);
              this.enemyTakeHit(e, b.damage);
              hit = true; break;
            }
          }
          if (hit) continue;
        }
      }
    }

    splatEffect(x: number, y: number, color: number) {
      var dot = this.add.circle(x, y, BULLET_RADIUS * 2.5, color, 0.8).setDepth(9);
      this.tweens.add({
        targets: dot, scaleX: 3, scaleY: 3, alpha: 0,
        duration: 320, ease: 'Power2',
        onComplete: function() { if (dot.active) dot.destroy(); }
      });
    }

    // ── Grenade system ──────────────────────────────────────────────────

    spawnGrenade(tx: number, ty: number) {
      var now = this.time.now;
      if (now - this.lastGrenade < GRENADE_CD) return;
      if (this.grenadeAmmo !== Infinity && this.grenadeAmmo <= 0) return;
      this.lastGrenade = now;
      if (this.grenadeAmmo !== Infinity) {
        this.grenadeAmmo--;
        if (this.grenadeTxt) {
          var gi = ({ frag: '💣', smoke: '💨', flash: '🔆', slow: '⏱️' } as Record<string,string>)[GRENADE_TYPE!] || '💣';
          this.grenadeTxt.setText(gi + ' ×' + this.grenadeAmmo);
        }
      }
      var dx = tx - this.heroX, dy = ty - this.heroY;
      var len = Math.sqrt(dx*dx + dy*dy);
      var spd = 320;
      var vx = len > 1 ? (dx/len)*spd : this.lastFacingX*spd;
      var vy = len > 1 ? (dy/len)*spd : this.lastFacingY*spd;
      var obj    = this.add.circle(this.heroX, this.heroY, 7, 0x886600).setDepth(9);
      var shadow = this.add.circle(this.heroX, this.heroY + 10, 5, 0x000000, 0.35).setDepth(6);
      this.grenades.push({ x: this.heroX, y: this.heroY, vx: vx, vy: vy,
        fuse: 1600, fuseMax: 1600, obj: obj, shadow: shadow });
    }

    updateGrenades(dt: number) {
      var now = this.time.now;
      for (var i = this.grenades.length - 1; i >= 0; i--) {
        var g = this.grenades[i];
        g.x += g.vx * dt;
        g.y += g.vy * dt;
        // Soft-bounce off canvas edges
        if (g.x < 12) { g.vx = Math.abs(g.vx)*0.6; g.x = 12; }
        if (g.x > this.W-12) { g.vx = -Math.abs(g.vx)*0.6; g.x = this.W-12; }
        if (g.y < 12) { g.vy = Math.abs(g.vy)*0.6; g.y = 12; }
        if (g.y > this.H-12) { g.vy = -Math.abs(g.vy)*0.6; g.y = this.H-12; }
        // Parabolic arc visual: bob above real y, grow shadow on "landing"
        var progress = 1 - (g.fuse / g.fuseMax);
        var arc = Math.sin(progress * Math.PI) * -18; // negative = up on screen
        g.obj.setPosition(g.x, g.y + arc);
        g.shadow.setPosition(g.x, g.y + 8);
        g.shadow.setScale(0.4 + progress * 1.4);
        // Count down fuse
        g.fuse -= dt * 1000;
        if (g.fuse <= 0) {
          g.obj.destroy(); g.shadow.destroy();
          this.grenades.splice(i, 1);
          this.detonateGrenade(g);
        }
      }
      // Expire smoke zones
      for (var si = this.smokeZones.length - 1; si >= 0; si--) {
        var sz = this.smokeZones[si];
        if (now > sz.until) {
          var szObj = sz.obj;
          this.tweens.add({ targets: szObj, alpha: 0, duration: 1200,
            onComplete: function() { if (szObj.active) szObj.destroy(); } });
          this.smokeZones.splice(si, 1);
        }
      }
    }

    detonateGrenade(g: any) {
      var fe = g.fromEnemy || false;
      if (GRENADE_TYPE === 'frag')        this.detonateFrag(g.x, g.y, fe);
      else if (GRENADE_TYPE === 'smoke')  this.detonateSmoke(g.x, g.y);
      else if (GRENADE_TYPE === 'flash')  this.detonateFlash(g.x, g.y, fe);
      else if (GRENADE_TYPE === 'slow')   this.detonateSlow(g.x, g.y);
    }

    detonateFrag(x: number, y: number, fromEnemy: boolean) {
      var BLAST = 90;
      // Expanding ring flash
      var ring = this.add.circle(x, y, 10, 0xff8800, 0.9).setDepth(20);
      this.tweens.add({ targets: ring, scaleX: BLAST/5, scaleY: BLAST/5, alpha: 0,
        duration: 420, ease: 'Power2',
        onComplete: function() { if (ring.active) ring.destroy(); } });
      var hDx = this.heroX - x, hDy = this.heroY - y;
      if (!fromEnemy) {
        // Hero-thrown frag: damage enemies in blast radius
        var self = this;
        for (var i = this.enemies.length - 1; i >= 0; i--) {
          var e = this.enemies[i];
          var ex = e.x - x, ey = e.y - y;
          if (ex*ex + ey*ey < BLAST*BLAST) {
            e.hp -= 2;
            this.splatEffect(e.x, e.y, 0xff8800);
            if (e.hp <= 0) {
              var zone = e.patrolZone;
              if (e.hpBar) e.hpBar.destroy();
              if (self.modeState) self.modeState.onEnemyDeath(self, e);
              e.obj.destroy();
              this.enemies.splice(i, 1);
              this.score++;
              this.scoreTxt.setText((GAME_MODE === 'ctf' ? 'Kills: ' : 'Score: ') + this.score);
              (function(z: any) { self.time.delayedCall(3000, function() {
                if (!self.isGameOver) self.spawnEnemy(z); }); })(zone);
            }
          }
        }
        // Self-damage: hero too close to own blast (inner 55% of radius)
        var selfBlast = BLAST * 0.55;
        if (hDx*hDx + hDy*hDy < selfBlast*selfBlast && !this.isInvincible) {
          this.heroTakeHit();
        }
      } else {
        // Enemy-thrown frag: damage hero if in range
        if (hDx*hDx + hDy*hDy < BLAST*BLAST && !this.isInvincible) {
          this.heroTakeHit();
        }
      }
    }

    detonateSmoke(x: number, y: number) {
      var SR = 80, DUR = 8000;
      var obj = this.add.circle(x, y, SR, 0x999999, 0.50).setDepth(11);
      this.smokeZones.push({ x: x, y: y, r: SR, until: this.time.now + DUR, obj: obj });
    }

    detonateFlash(x: number, y: number, fromEnemy: boolean) {
      var FR = 200;
      var now = this.time.now;
      // White screen flash (visual for everyone)
      var flash = this.add.rectangle(this.W/2, this.H/2, this.W, this.H, 0xffffff, 0.95).setDepth(100);
      this.tweens.add({ targets: flash, alpha: 0, duration: 1500, ease: 'Power2',
        onComplete: function() { if (flash.active) flash.destroy(); } });
      // Hero disorientation (if hero is in range)
      var hDx = this.heroX - x, hDy = this.heroY - y;
      if (hDx*hDx + hDy*hDy < FR*FR) {
        this.heroDisorientedUntil = now + 1500;
        var yFlash = this.add.rectangle(this.W/2, this.H/2, this.W, this.H, 0xffee00, 0.20).setDepth(53);
        this.tweens.add({ targets: yFlash, alpha: 0, delay: 700, duration: 800,
          onComplete: function() { if (yFlash.active) yFlash.destroy(); } });
      }
      // Blind nearby enemies
      for (var i = 0; i < this.enemies.length; i++) {
        var e = this.enemies[i];
        var ex = e.x - x, ey = e.y - y;
        if (ex*ex + ey*ey < FR*FR) {
          e.blindedUntil = now + 3000;
          var ba = Math.random() * Math.PI * 2;
          e.lastFacingX = Math.cos(ba); e.lastFacingY = Math.sin(ba);
          e.state = 'patrol';
        }
      }
    }

    detonateSlow(x: number, y: number) {
      this.slowUntil = this.time.now + 4000;
      var overlay = this.add.rectangle(this.W/2, this.H/2, this.W, this.H, 0x2244ff, 0.18).setDepth(51);
      this.tweens.add({ targets: overlay, alpha: 0, delay: 3000, duration: 1000,
        onComplete: function() { if (overlay.active) overlay.destroy(); } });
    }

    updateFog() {
      this.visionShape.clear();
      this.visionShape.fillStyle(0xffffff);
      this.visionShape.fillCircle(this.heroX, this.heroY, FOG_RADIUS);
    }

    // ── Hero actions ────────────────────────────────────────────────────

    tryHeroShoot(targetX: number, targetY: number) {
      var now = this.time.now;
      if (now - this.lastShot < this.currentFireRate) return;
      this.lastShot = now;
      var dx = targetX - this.heroX, dy = targetY - this.heroY;
      var len = Math.sqrt(dx*dx + dy*dy);
      if (len < 1) { dx = this.lastFacingX; dy = this.lastFacingY; len = 1; }
      this.lastFacingX = dx/len; this.lastFacingY = dy/len;
      var nx = dx/len, ny = dy/len;
      if (this.currentWeapon === 'shotgun') {
        var baseAngle = Math.atan2(ny, nx);
        var spread = [-0.34, -0.17, 0, 0.17, 0.34];
        for (var si = 0; si < spread.length; si++) {
          var a = baseAngle + spread[si];
          this.spawnBullet(this.heroX, this.heroY, Math.cos(a)*PROJ_SPEED*0.9, Math.sin(a)*PROJ_SPEED*0.9, false, 1);
        }
      } else if (this.currentWeapon === 'sniper') {
        this.spawnBullet(this.heroX, this.heroY, nx*PROJ_SPEED*1.8, ny*PROJ_SPEED*1.8, false, 3);
      } else {
        this.spawnBullet(this.heroX, this.heroY, nx*PROJ_SPEED, ny*PROJ_SPEED, false, 1);
      }
      this.sounds.shoot && this.sounds.shoot();
    }

    heroTakeHit() {
      this.heroHp = Math.max(0, this.heroHp - 1);
      this.buildHpHUD();
      this.sounds.hit && this.sounds.hit();
      // Drop flag if carrying in CTF
      if (this.modeState) this.modeState.onHeroDeath(this, this.heroX, this.heroY);
      if (this.heroHp <= 0) { this.triggerGameOver(); return; }
      this.isInvincible = true;
      var hero = this.heroObj;
      this.tweens.add({
        targets: hero, alpha: 0.2, duration: 100, yoyo: true, repeat: 6,
        onComplete: function() { if (hero.active) hero.setAlpha(1); }
      });
      var self = this;
      this.time.delayedCall(1200, function() { self.isInvincible = false; });
    }

    buildHpHUD() {
      if (this.hpObjs) this.hpObjs.forEach(function(h: any) { if (h.active) h.destroy(); });
      this.hpObjs = [];
      for (var i = 0; i < HERO_HP; i++) {
        var h = this.add.text(16 + i*28, 52, i < this.heroHp ? '❤️' : '🖤', {
          fontSize: '20px', fontFamily: 'Arial'
        }).setDepth(56);
        this.hpObjs.push(h);
      }
    }

    // ── Enemy system ────────────────────────────────────────────────────

    buildZones() {
      var W = this.W, H = this.H;
      var cx = W/2, cy = H/2;
      return [
        { x: 20,    y: 20,    w: cx-40, h: cy-40 }, // top-left
        { x: cx+20, y: 20,    w: cx-40, h: cy-40 }, // top-right
        { x: 20,    y: cy+20, w: cx-40, h: cy-40 }, // bottom-left
        { x: cx+20, y: cy+20, w: cx-40, h: cy-40 }, // bottom-right
      ];
    }

    isPositionInWall(cx: number, cy: number, r: number) {
      for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];
        var nx = Math.max(w.x, Math.min(w.x+w.w, cx));
        var ny = Math.max(w.y, Math.min(w.y+w.h, cy));
        var dx = cx-nx, dy = cy-ny;
        if (dx*dx + dy*dy < r*r) return true;
      }
      return false;
    }

    spawnEnemy(zone: any) {
      var eType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
      var stats  = ETYPE_STATS[eType] || ETYPE_STATS.grunt;
      var x: number, y: number, attempts = 0;
      do {
        x = Phaser.Math.Between(zone.x + 30, Math.max(zone.x + 35, zone.x + zone.w - 30));
        y = Phaser.Math.Between(zone.y + 30, Math.max(zone.y + 35, zone.y + zone.h - 30));
        attempts++;
      } while (attempts < 20 && this.isPositionInWall(x, y, stats.radius));

      var obj: any;
      var enemyDispSize = Math.round(44 * ENTITY_SCALE);
      if (this.useEnemySpr) {
        obj = this.add.image(x, y, 'enemy-spr').setDisplaySize(enemyDispSize,enemyDispSize).setOrigin(0.5).setDepth(4);
      } else {
        obj = this.add.text(x, y, config.enemyEmoji || '🎭', {
          fontSize: enemyDispSize + 'px', fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(4);
      }
      if (stats.scale !== 1.0) obj.setScale(stats.scale);
      if (stats.tint !== -1)   obj.setTint(stats.tint);

      var axis = Math.random() < 0.5 ? 'x' : 'y';
      var initAngle = Math.random() * Math.PI * 2;
      var hpBar = this.add.graphics().setDepth(12);
      var enemyObj: any = {
        x: x, y: y,
        hp: stats.hp, maxHp: stats.hp,
        eType: eType,
        radius: stats.radius,
        state: 'patrol',
        patrolZone: zone,
        patrolDir: 1,
        patrolAxis: axis,
        patrolSpeed: Phaser.Math.Between(stats.patrolMin, stats.patrolMax),
        alertSpeed: stats.alertSpd,
        shootsBack: stats.shootsBack,
        frMult: stats.frMult,
        shootTimer: 0,
        grenadeTimer: 0,
        lastFacingX: Math.cos(initAngle),
        lastFacingY: Math.sin(initAngle),
        blindedUntil: 0,
        hpBar: hpBar,
        obj: obj,
        aiRole: null,
        carrying: null,
      };
      // Assign AI role for objective modes
      if (this.modeState) AIRoles.assignRole(enemyObj, this.modeState);
      this.enemies.push(enemyObj);
    }

    enemyTakeHit(e: any, dmg: number) {
      e.hp -= (dmg || 1);
      if (e.hp <= 0) {
        var obj = e.obj;
        if (e.hpBar && e.hpBar.active) e.hpBar.destroy();
        this.tweens.add({
          targets: obj, alpha: 0, scaleX: 1.8, scaleY: 1.8,
          duration: 250, ease: 'Power2',
          onComplete: function() { if (obj.active) obj.destroy(); }
        });
        // Notify mode system (drop flag if carrying)
        if (this.modeState) this.modeState.onEnemyDeath(this, e);
        this.enemies.splice(this.enemies.indexOf(e), 1);
        this.score++;
        this.scoreTxt.setText((GAME_MODE === 'ctf' ? 'Kills: ' : 'Score: ') + this.score);
        this.sounds.score && this.sounds.score();
        // Respawn in same zone after 3s
        var self = this;
        var zone = e.patrolZone;
        this.time.delayedCall(3000, function() {
          if (!self.isGameOver) self.spawnEnemy(zone);
        });
      } else {
        // Flash and seek cover
        e.state = 'cover';
        var obj2 = e.obj;
        this.tweens.add({
          targets: obj2, alpha: 0.3, duration: 80, yoyo: true, repeat: 2,
          onComplete: function() { if (obj2.active) obj2.setAlpha(1); }
        });
      }
    }

    // ── Enemy AI state machine ──────────────────────────────────────────

    updateEnemy(e: any, dt: number) {
      // Flashbang: blinded enemies wander randomly, ignore hero
      if (e.blindedUntil && this.time.now < e.blindedUntil) {
        e.x += e.lastFacingX * 55 * dt;
        e.y += e.lastFacingY * 55 * dt;
        var br = this.resolveWallCollision(e.x, e.y, e.radius || ENEMY_RADIUS);
        e.x = br.x; e.y = br.y;
        e.obj.setPosition(e.x, e.y);
        if (Math.random() < 0.02) {
          var ba = Math.random() * Math.PI * 2;
          e.lastFacingX = Math.cos(ba); e.lastFacingY = Math.sin(ba);
        }
        return;
      }

      var hx = this.heroX, hy = this.heroY;

      // ── AI role override: redirect target for objective modes ──────
      var roleTarget = (this.modeState && e.aiRole) ? AIRoles.getTarget(e, this.modeState, hx, hy) : null;
      var targetX = roleTarget ? roleTarget.x : hx;
      var targetY = roleTarget ? roleTarget.y : hy;
      var alertRange = roleTarget ? (roleTarget.alertRange || 280) : 280;

      var dx = targetX - e.x, dy = targetY - e.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      // LOS always checked against hero (for shooting) and target (for movement)
      var losHero   = this.hasLOS(e.x, e.y, hx, hy);
      var losTarget = roleTarget ? this.hasLOS(e.x, e.y, targetX, targetY) : losHero;
      var los = losHero;

      var er = e.radius || ENEMY_RADIUS;

      // Carriers in CTF: move toward target (base) at boosted speed
      if (e.carrying && roleTarget && roleTarget.fleeing) {
        var nx3 = e.x + (dx/Math.max(1,dist)) * (e.alertSpeed || 95) * 1.2 * dt;
        var ny3 = e.y + (dy/Math.max(1,dist)) * (e.alertSpeed || 95) * 1.2 * dt;
        var res3 = this.resolveWallCollision(nx3, ny3, er);
        e.x = res3.x; e.y = res3.y;
        // Only shoot hero if very close
        var heroDx = hx - e.x, heroDy = hy - e.y;
        var heroDist = Math.sqrt(heroDx*heroDx + heroDy*heroDy);
        if (heroDist < 100 && losHero && e.shootsBack !== false) {
          e.shootTimer += dt * 1000;
          var eFireRate2 = this.currentEnemyFireRate * (e.frMult || 1.0);
          if (e.shootTimer >= eFireRate2) {
            e.shootTimer = 0;
            this.spawnBullet(e.x, e.y, (heroDx/heroDist)*PROJ_SPEED, (heroDy/heroDist)*PROJ_SPEED, true);
          }
        }
        e.x = Math.max(er, Math.min(this.W - er, e.x));
        e.y = Math.max(er, Math.min(this.H - er, e.y));
        e.obj.setPosition(e.x, e.y);
        if (e.hpBar) { e.hpBar.clear(); }
        return;
      }

      if (e.state === 'patrol') {
        // Role-aware patrol: defenders/captures move toward target instead of pacing
        if (roleTarget && !roleTarget.urgent && dist > 30) {
          var pnx = e.x + (dx/dist) * e.patrolSpeed * dt;
          var pny = e.y + (dy/dist) * e.patrolSpeed * dt;
          var pRes = this.resolveWallCollision(pnx, pny, er);
          e.x = pRes.x; e.y = pRes.y;
        } else {
          var spd = e.patrolSpeed;
          if (e.patrolAxis === 'x') {
            e.x += e.patrolDir * spd * dt;
            if (e.x > e.patrolZone.x + e.patrolZone.w - 20) e.patrolDir = -1;
            if (e.x < e.patrolZone.x + 20)                  e.patrolDir =  1;
          } else {
            e.y += e.patrolDir * spd * dt;
            if (e.y > e.patrolZone.y + e.patrolZone.h - 20) e.patrolDir = -1;
            if (e.y < e.patrolZone.y + 20)                  e.patrolDir =  1;
          }
        }
        var patRes = this.resolveWallCollision(e.x, e.y, er);
        e.x = patRes.x; e.y = patRes.y;
        // Alert when hero is visible and in range
        var heroAlertDx = hx - e.x, heroAlertDy = hy - e.y;
        var heroAlertDist = Math.sqrt(heroAlertDx*heroAlertDx + heroAlertDy*heroAlertDy);
        if (losHero && heroAlertDist < alertRange) e.state = 'alert';

      } else if (e.state === 'alert') {
        if (dist > 0) {
          var nx = e.x + (dx/dist) * (e.alertSpeed || 95) * dt;
          var ny = e.y + (dy/dist) * (e.alertSpeed || 95) * dt;
          var res = this.resolveWallCollision(nx, ny, er);
          e.x = res.x; e.y = res.y;
        }
        if (dist < 150 && los) { e.state = 'shoot'; e.shootTimer = 0; }
        if (dist > 380 || !los) e.state = 'patrol';

      } else if (e.state === 'shoot') {
        var eFireRate = this.currentEnemyFireRate * (e.frMult || 1.0);
        if (e.shootsBack !== false) {
          e.shootTimer += dt * 1000;
          if (e.shootTimer >= eFireRate) {
            e.shootTimer = 0;
            if (dist > 0) {
              this.spawnBullet(e.x, e.y, (dx/dist)*PROJ_SPEED, (dy/dist)*PROJ_SPEED, true);
            }
          }
        }
        // Enemy grenade throw
        if (ENEMY_GRENADES && dist > 0) {
          e.grenadeTimer = (e.grenadeTimer || 0) + dt * 1000;
          if (e.grenadeTimer >= ENEMY_GRENADE_CD) {
            e.grenadeTimer = 0;
            this.spawnEnemyGrenade(e);
          }
        }
        // Scouts can't enter shoot state — fall back to alert
        if (e.shootsBack === false) { e.state = 'alert'; }
        if (!los || dist > 240) e.state = 'alert';
        // Occasionally seek cover when damaged
        if (e.hp < e.maxHp && Math.random() < 0.008) e.state = 'cover';

      } else if (e.state === 'cover') {
        var target = this.findCoverPoint(e);
        if (target) {
          var tdx = target.x - e.x, tdy = target.y - e.y;
          var tdist = Math.sqrt(tdx*tdx + tdy*tdy);
          if (tdist < 12) {
            e.state = 'patrol';
          } else {
            var nx2 = e.x + (tdx/tdist) * 110 * dt;
            var ny2 = e.y + (tdy/tdist) * 110 * dt;
            var res2 = this.resolveWallCollision(nx2, ny2, er);
            e.x = res2.x; e.y = res2.y;
          }
        } else {
          e.state = 'patrol';
        }
      }

      e.x = Math.max(er, Math.min(this.W - er, e.x));
      e.y = Math.max(er, Math.min(this.H - er, e.y));
      e.obj.setPosition(e.x, e.y);

      // Draw HP bar (only when damaged)
      if (e.hpBar) {
        e.hpBar.clear();
        if (e.hp < e.maxHp) {
          var barW = er * 2 + 6, barH = 4;
          var bary = e.y - er - 9;
          e.hpBar.fillStyle(0x222222, 0.8);
          e.hpBar.fillRect(e.x - barW/2, bary, barW, barH);
          var ratio = e.hp / e.maxHp;
          var col = ratio > 0.6 ? 0x44dd44 : ratio > 0.3 ? 0xdddd22 : 0xdd2222;
          e.hpBar.fillStyle(col, 1);
          e.hpBar.fillRect(e.x - barW/2, bary, barW * ratio, barH);
        }
      }
    }

    findCoverPoint(e: any) {
      var hx = this.heroX, hy = this.heroY;
      var best: any = null, bestDist = Infinity;
      for (var i = 0; i < this.walls.length; i++) {
        var w = this.walls[i];
        var er2 = e.radius || ENEMY_RADIUS;
        var pts = [
          { x: w.x + w.w/2, y: w.y - er2 - 5 },
          { x: w.x + w.w/2, y: w.y + w.h + er2 + 5 },
          { x: w.x - er2 - 5, y: w.y + w.h/2 },
          { x: w.x + w.w + er2 + 5, y: w.y + w.h/2 },
        ];
        for (var pi = 0; pi < pts.length; pi++) {
          var pt = pts[pi];
          // Prefer positions the hero can't see
          if (!this.hasLOS(hx, hy, pt.x, pt.y)) {
            var d = (pt.x-e.x)*(pt.x-e.x) + (pt.y-e.y)*(pt.y-e.y);
            if (d < bestDist) { bestDist = d; best = pt; }
          }
        }
      }
      // Fallback: nearest wall centroid
      if (!best && this.walls.length > 0) {
        for (var j = 0; j < this.walls.length; j++) {
          var w2 = this.walls[j];
          var cx = w2.x + w2.w/2, cy = w2.y + w2.h/2;
          var d2 = (cx-e.x)*(cx-e.x) + (cy-e.y)*(cy-e.y);
          if (d2 < bestDist) { bestDist = d2; best = { x: cx, y: cy }; }
        }
      }
      return best;
    }

    // ── Pickup system ────────────────────────────────────────────────────

    randomPickupPos(margin: number) {
      var W = this.W, H = this.H;
      margin = margin || 40;
      for (var attempts = 0; attempts < 50; attempts++) {
        var x = Phaser.Math.Between(margin, W - margin);
        var y = Phaser.Math.Between(margin, H - margin);
        var dx = x - W/2, dy = y - H/2;
        if (dx*dx + dy*dy < 80*80) continue; // avoid center spawn
        if (!this.isPositionInWall(x, y, 18)) return { x: x, y: y };
      }
      return { x: Phaser.Math.Between(margin, W - margin), y: Phaser.Math.Between(margin, H - margin) };
    }

    spawnInitialPickups(type: string, count: number) {
      for (var i = 0; i < count; i++) {
        var pos = this.randomPickupPos(40);
        this.spawnPickup(type, pos.x, pos.y);
      }
    }

    spawnPickup(type: string, x: number, y: number) {
      var color  = type === 'health' ? 0x33cc44 : 0xddaa11;
      var emoji  = type === 'health' ? '❤️' : '📦';
      var circle = this.add.circle(x, y, 12, color, 0.85).setDepth(7);
      var label  = this.add.text(x, y, emoji, { fontSize: '15px', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(8);
      this.tweens.add({ targets: [circle, label], y: '-=5', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.pickups.push({ x: x, y: y, type: type, obj: circle, labelObj: label, respawnAt: 0 });
    }

    updatePickups() {
      var now = this.time.now;
      for (var i = 0; i < this.pickups.length; i++) {
        var p = this.pickups[i];
        // Respawn when destroyed + timer elapsed
        if (!p.obj || !p.obj.active) {
          if (p.respawnAt > 0 && now > p.respawnAt) {
            var pos = this.randomPickupPos(40);
            p.x = pos.x; p.y = pos.y;
            var color = p.type === 'health' ? 0x33cc44 : 0xddaa11;
            var emoji  = p.type === 'health' ? '❤️' : '📦';
            p.obj = this.add.circle(pos.x, pos.y, 12, color, 0.85).setDepth(7);
            p.labelObj = this.add.text(pos.x, pos.y, emoji, { fontSize: '15px', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(8);
            this.tweens.add({ targets: [p.obj, p.labelObj], y: '-=5', duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            p.respawnAt = 0;
          }
          continue;
        }
        // Collision with hero
        var pdx = this.heroX - p.x, pdy = this.heroY - p.y;
        if (pdx*pdx + pdy*pdy < (HERO_RADIUS + 14) * (HERO_RADIUS + 14)) {
          if (p.type === 'health' && this.heroHp < HERO_HP) {
            this.heroHeal();
            p.obj.destroy(); if (p.labelObj) p.labelObj.destroy();
            p.obj = null; p.labelObj = null; p.respawnAt = now + 18000;
          } else if (p.type === 'grenade' && this.grenadeAmmo !== Infinity) {
            this.grenadeAmmo = Math.min(this.grenadeAmmo + 2, GRENADE_COUNT + 2);
            if (this.grenadeTxt) {
              var gi = ({ frag: '💣', smoke: '💨', flash: '🔆', slow: '⏱️' } as Record<string,string>)[GRENADE_TYPE!] || '💣';
              this.grenadeTxt.setText(gi + ' ×' + this.grenadeAmmo);
            }
            p.obj.destroy(); if (p.labelObj) p.labelObj.destroy();
            p.obj = null; p.labelObj = null; p.respawnAt = now + 18000;
          }
        }
      }
    }

    heroHeal() {
      this.heroHp = Math.min(this.heroHp + 1, HERO_HP);
      this.buildHpHUD();
      // Brief green flash on hero
      var hero = this.heroObj;
      this.tweens.add({ targets: hero, alpha: 0.4, duration: 80, yoyo: true, repeat: 1,
        onComplete: function() { if (hero.active) hero.setAlpha(1); } });
    }

    // ── Weapon pickup system ─────────────────────────────────────────────

    spawnInitialWeapons() {
      var pool = ['machinegun', 'shotgun', 'sniper'];
      var count = Math.min(2, pool.length);
      for (var i = 0; i < count; i++) {
        var pos = this.randomPickupPos(60);
        this.spawnWeapon(pool[i], pos.x, pos.y);
      }
    }

    spawnWeapon(weaponId: string, x: number, y: number) {
      var colors: Record<string,number> = { machinegun: 0x4488ff, shotgun: 0xff8844, sniper: 0xaa44ff };
      var icons: Record<string,string>  = { machinegun: '🔫', shotgun: '💥', sniper: '🎯' };
      var circle = this.add.circle(x, y, 14, colors[weaponId] || 0x888888, 0.9).setDepth(7);
      var label  = this.add.text(x, y, icons[weaponId] || '🔫', { fontSize: '18px', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(8);
      this.tweens.add({ targets: [circle, label], y: '-=5', duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.weaponPickupObjs.push({ x: x, y: y, weaponId: weaponId, obj: circle, labelObj: label, respawnAt: 0 });
    }

    updateWeaponPickups() {
      var now = this.time.now;
      var self = this;
      var fRates: Record<string,number> = { pistol: FIRE_RATE, machinegun: 100, shotgun: 700, sniper: 1000 };
      var colors: Record<string,number> = { machinegun: 0x4488ff, shotgun: 0xff8844, sniper: 0xaa44ff };
      var icons: Record<string,string>  = { machinegun: '🔫', shotgun: '💥', sniper: '🎯' };
      var names: Record<string,string>  = { machinegun: 'Machine Gun', shotgun: 'Shotgun', sniper: 'Sniper' };
      for (var i = 0; i < this.weaponPickupObjs.length; i++) {
        var wp = this.weaponPickupObjs[i];
        if (!wp.obj || !wp.obj.active) {
          if (wp.respawnAt > 0 && now > wp.respawnAt) {
            var pos = this.randomPickupPos(60);
            wp.x = pos.x; wp.y = pos.y;
            wp.obj = this.add.circle(pos.x, pos.y, 14, colors[wp.weaponId] || 0x888888, 0.9).setDepth(7);
            wp.labelObj = this.add.text(pos.x, pos.y, icons[wp.weaponId] || '🔫', { fontSize: '18px', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(8);
            this.tweens.add({ targets: [wp.obj, wp.labelObj], y: '-=5', duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
            wp.respawnAt = 0;
          }
          continue;
        }
        var wdx = this.heroX - wp.x, wdy = this.heroY - wp.y;
        if (wdx*wdx + wdy*wdy < (HERO_RADIUS + 16) * (HERO_RADIUS + 16)) {
          self.currentWeapon   = wp.weaponId;
          self.currentFireRate = fRates[wp.weaponId] || FIRE_RATE;
          var banner = self.add.text(self.W/2, self.H * 0.28,
            'Got ' + (names[wp.weaponId] || wp.weaponId) + '! ' + (icons[wp.weaponId] || '🔫'), {
            fontSize: '22px', color: '#ffee44', stroke: '#000', strokeThickness: 4,
          }).setOrigin(0.5).setDepth(57);
          self.tweens.add({ targets: banner, alpha: 0, y: self.H * 0.22, delay: 1200, duration: 600,
            onComplete: function() { if (banner.active) banner.destroy(); } });
          wp.obj.destroy(); wp.labelObj.destroy();
          wp.obj = null; wp.labelObj = null; wp.respawnAt = now + 20000;
        }
      }
    }

    // ── Enemy grenade ────────────────────────────────────────────────────

    spawnEnemyGrenade(e: any) {
      var dx = this.heroX - e.x, dy = this.heroY - e.y;
      var len = Math.sqrt(dx*dx + dy*dy);
      if (len < 1) return;
      var spd = 280;
      var obj    = this.add.circle(e.x, e.y, 6, 0xcc4400).setDepth(9);
      var shadow = this.add.circle(e.x, e.y + 10, 4, 0x000000, 0.30).setDepth(6);
      this.grenades.push({
        x: e.x, y: e.y,
        vx: (dx/len)*spd, vy: (dy/len)*spd,
        fuse: 1600, fuseMax: 1600,
        obj: obj, shadow: shadow,
        fromEnemy: true,
      });
    }

    // ── Difficulty ramp ─────────────────────────────────────────────────

    updateDifficultyRamp(delta: number) {
      this.rampTimer += delta;
      var ramp30 = Math.floor(this.rampTimer / 30000);
      this.currentEnemyFireRate = Math.max(800, ENEMY_FR_BASE - ramp30 * 200);
      var ramp60 = Math.floor(this.rampTimer / 60000);
      var newMax = Math.min(8, MAX_ENEMIES + ramp60);
      if (newMax > this.currentMaxEnemies) {
        this.currentMaxEnemies = newMax;
        var zone = this.zones[Phaser.Math.Between(0, this.zones.length - 1)];
        this.spawnEnemy(zone);
      }
    }

    // ── Main update ─────────────────────────────────────────────────────

    update(time: number, delta: number) {
      if (this.isGameOver) return;
      var dt = delta / 1000;
      // Slow-motion grenade: enemies + bullets run at 0.25× speed, hero at full speed
      var gameDt = (this.slowUntil > 0 && time < this.slowUntil) ? dt * 0.25 : dt;

      this.updateDifficultyRamp(delta);

      // ── Aim direction: always track toward mouse/pointer ─────────────────
      var aimPtr = this.input.activePointer;
      if (aimPtr && (aimPtr.x > 0 || aimPtr.y > 0)) {
        var adx = aimPtr.x - this.heroX;
        var ady = aimPtr.y - this.heroY;
        var al  = Math.sqrt(adx*adx + ady*ady);
        if (al > 5) { this.lastFacingX = adx/al; this.lastFacingY = ady/al; }
      }
      // Rotate hero sprite/emoji to face aim direction
      var aimAngle = Math.atan2(this.lastFacingY, this.lastFacingX);
      this.heroObj.setRotation(aimAngle);
      // Draw yellow gun-tip indicator dot
      this.heroGunIndicator.clear();
      this.heroGunIndicator.fillStyle(0xffdd00, 0.9);
      this.heroGunIndicator.fillCircle(
        this.heroX + this.lastFacingX * 26,
        this.heroY + this.lastFacingY * 26, 4);

      // Hero movement (inverted when disoriented from flashbang)
      var vx = 0, vy = 0;
      var disorient = (this.heroDisorientedUntil > 0 && time < this.heroDisorientedUntil) ? -1 : 1;
      if (this.cursors.left.isDown  || this.wasd.A.isDown) vx = -disorient;
      if (this.cursors.right.isDown || this.wasd.D.isDown) vx =  disorient;
      if (this.cursors.up.isDown    || this.wasd.W.isDown) vy = -disorient;
      if (this.cursors.down.isDown  || this.wasd.S.isDown) vy =  disorient;
      // Mobile hold-to-move
      if (vx === 0 && vy === 0 && this.pointerDown && this.pointerTarget) {
        var pdx = this.pointerTarget.x - this.heroX;
        var pdy = this.pointerTarget.y - this.heroY;
        var pdist = Math.sqrt(pdx*pdx + pdy*pdy);
        if (pdist > 12) { vx = pdx/pdist; vy = pdy/pdist; }
      }
      if (vx !== 0 && vy !== 0) { vx *= 0.707; vy *= 0.707; }
      // Note: lastFacingX/Y is set from pointer above; fallback for keyboard-only
      if ((vx !== 0 || vy !== 0) && (!aimPtr || (aimPtr.x === 0 && aimPtr.y === 0))) {
        this.lastFacingX = vx; this.lastFacingY = vy;
      }

      var newHX = this.heroX + vx * HERO_SPEED * dt;
      var newHY = this.heroY + vy * HERO_SPEED * dt;
      var resolved = this.resolveWallCollision(newHX, newHY, HERO_RADIUS);
      this.heroX = resolved.x; this.heroY = resolved.y;
      this.heroObj.setPosition(this.heroX, this.heroY);

      // Keyboard shoot: SPACE fires toward mouse or last facing direction
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        var ptr = this.input.activePointer;
        if (ptr && (ptr.x > 0 || ptr.y > 0)) {
          this.tryHeroShoot(ptr.x, ptr.y);
        } else {
          this.tryHeroShoot(
            this.heroX + this.lastFacingX * 300,
            this.heroY + this.lastFacingY * 300
          );
        }
      }
      // Desktop: mouse button held = continuous fire
      var activePtr = this.input.activePointer;
      if (activePtr && activePtr.isDown && !this.pointerDown) {
        this.tryHeroShoot(activePtr.x, activePtr.y);
      }

      // Grenade throw — E key
      if (GRENADE_TYPE && this.grenadeKey && Phaser.Input.Keyboard.JustDown(this.grenadeKey)) {
        var gPtr = this.input.activePointer;
        var gTx = (gPtr && (gPtr.x > 0 || gPtr.y > 0)) ? gPtr.x : this.heroX + this.lastFacingX * 200;
        var gTy = (gPtr && (gPtr.x > 0 || gPtr.y > 0)) ? gPtr.y : this.heroY + this.lastFacingY * 200;
        this.spawnGrenade(gTx, gTy);
      }

      // Update enemies + bullets (slowed during slow-mo)
      for (var i = this.enemies.length - 1; i >= 0; i--) {
        this.updateEnemy(this.enemies[i], gameDt);
      }
      this.updateBullets(gameDt);

      // Update grenades (always real time) + fog mask
      if (GRENADE_TYPE) this.updateGrenades(dt);
      if (FOG_OF_WAR) this.updateFog();

      // Update pickups + weapon pickups
      this.updatePickups();
      if (WEAPON_PICKUPS) this.updateWeaponPickups();

      // Update game mode (CTF objectives, scoring, timer)
      if (this.modeState) {
        var modeResult = this.modeState.update(this, dt, gameDt, this.heroX, this.heroY, HERO_RADIUS, this.enemies);
        if (modeResult === 'victory')  { this.triggerVictory(); return; }
        if (modeResult === 'defeat')   { this.triggerGameOver(); return; }
      }
    }

    // ── Game Over ───────────────────────────────────────────────────────

    triggerGameOver() {
      this.isGameOver = true;
      this.sounds.gameOver && this.sounds.gameOver();
      if (this.useHeroSpr) {
        this.heroObj.setTint(0xff4444);
      } else {
        this.heroObj.setText('💥');
      }
      // Clean up gun indicator, bullets, grenades, smoke, fog, pickups, weapons, hp bars
      if (this.heroGunIndicator) this.heroGunIndicator.destroy();
      this.heroObj.setRotation(0);
      this.bullets.forEach(function(b: any) { if (b.obj.active) b.obj.destroy(); });
      this.bullets = [];
      this.grenades.forEach(function(g: any) {
        if (g.obj.active) g.obj.destroy();
        if (g.shadow.active) g.shadow.destroy();
      });
      this.grenades = [];
      this.smokeZones.forEach(function(sz: any) { if (sz.obj.active) sz.obj.destroy(); });
      this.smokeZones = [];
      if (this.fogGraphics && this.fogGraphics.active) this.fogGraphics.destroy();
      this.enemies.forEach(function(e: any) {
        if (e.hpBar && e.hpBar.active) e.hpBar.destroy();
      });
      this.pickups.forEach(function(p: any) {
        if (p.obj && p.obj.active) p.obj.destroy();
        if (p.labelObj && p.labelObj.active) p.labelObj.destroy();
      });
      this.pickups = [];
      this.weaponPickupObjs.forEach(function(wp: any) {
        if (wp.obj && wp.obj.active) wp.obj.destroy();
        if (wp.labelObj && wp.labelObj.active) wp.labelObj.destroy();
      });
      this.weaponPickupObjs = [];
      // Clean up mode system
      if (this.modeState) this.modeState.destroy();

      var cx = this.W/2, cy = this.H/2;
      this.add.rectangle(cx, cy, 420, 230, 0x000000, 0.82).setDepth(40);
      this.add.text(cx, cy-68, '💥 Game Over!', {
        fontSize: '36px', color: '#ff4444', stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(41);
      var overMsg = GAME_MODE === 'ctf'
        ? 'Captures: 🔵 ' + MatchScoring.heroScore + ' – ' + MatchScoring.enemyScore + ' 🔴'
        : 'Score: ' + this.score + ' enemies eliminated';
      this.add.text(cx, cy-12, overMsg, {
        fontSize: '24px', color: '#fff',
      }).setOrigin(0.5).setDepth(41);
      this.add.text(cx, cy+42, 'Tap or SPACE to play again!', {
        fontSize: '18px', color: '#aaa',
      }).setOrigin(0.5).setDepth(41);

      var self = this;
      this.input.keyboard!.once('keydown', function() { self.scene.restart(); });
      this.input.once('pointerdown', function() { self.scene.restart(); });
    }

    // ── Victory (objective modes) ──────────────────────────────────────

    triggerVictory() {
      this.isGameOver = true;
      this.sounds.score && this.sounds.score();
      // Clean up game elements
      if (this.heroGunIndicator) this.heroGunIndicator.destroy();
      this.heroObj.setRotation(0);
      this.bullets.forEach(function(b: any) { if (b.obj.active) b.obj.destroy(); });
      this.bullets = [];
      this.grenades.forEach(function(g: any) {
        if (g.obj.active) g.obj.destroy();
        if (g.shadow.active) g.shadow.destroy();
      });
      this.grenades = [];
      this.smokeZones.forEach(function(sz: any) { if (sz.obj.active) sz.obj.destroy(); });
      this.smokeZones = [];
      if (this.fogGraphics && this.fogGraphics.active) this.fogGraphics.destroy();
      this.enemies.forEach(function(e: any) {
        if (e.hpBar && e.hpBar.active) e.hpBar.destroy();
      });
      this.pickups.forEach(function(p: any) {
        if (p.obj && p.obj.active) p.obj.destroy();
        if (p.labelObj && p.labelObj.active) p.labelObj.destroy();
      });
      this.pickups = [];
      this.weaponPickupObjs.forEach(function(wp: any) {
        if (wp.obj && wp.obj.active) wp.obj.destroy();
        if (wp.labelObj && wp.labelObj.active) wp.labelObj.destroy();
      });
      this.weaponPickupObjs = [];
      if (this.modeState) this.modeState.destroy();

      var cx = this.W/2, cy = this.H/2;
      this.add.rectangle(cx, cy, 420, 260, 0x000000, 0.82).setDepth(40);
      this.add.text(cx, cy-78, '🏆 VICTORY! 🏆', {
        fontSize: '36px', color: '#44ff44', stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(41);
      this.add.text(cx, cy-22, 'Captures: 🔵 ' + MatchScoring.heroScore + ' – ' + MatchScoring.enemyScore + ' 🔴', {
        fontSize: '24px', color: '#fff',
      }).setOrigin(0.5).setDepth(41);
      this.add.text(cx, cy+18, 'Kills: ' + this.score, {
        fontSize: '20px', color: '#ccc',
      }).setOrigin(0.5).setDepth(41);
      this.add.text(cx, cy+56, 'Tap or SPACE to play again!', {
        fontSize: '18px', color: '#aaa',
      }).setOrigin(0.5).setDepth(41);

      var self = this;
      this.input.keyboard!.once('keydown', function() { self.scene.restart(); });
      this.input.once('pointerdown', function() { self.scene.restart(); });
    }
  }

  game = new Phaser.Game(makePhaserConfig(config.backgroundColor || '#2d4a2d', ShooterScene));
}
