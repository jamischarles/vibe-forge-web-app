// ── Action System ─────────────────────────────────────────────────────────────
// Interprets config.actions[] at runtime. Both scenes call init/tick/handleCollision/destroy.
var ActionSystem = {
  state: {} as any,

  init: function(scene: any) {
    var st: any = {};
    var actions = (currentConfig && currentConfig.actions) || [];
    actions.forEach(function(a) {
      if (a.type === 'lives') {
        st.lives = (a.params && a.params.count) || 3;
        st.maxLives = st.lives;
        st.isInvincible = false;
        st.livesObjs = [];
      }
      if (a.type === 'collectible') {
        st.collectibles = [];
        st.collectibleTimer = 0;
      }
      if (a.type === 'shield') {
        st.shieldActive = false;
        st.shieldTimer = 0;
        st.shieldItem = null;
        st.shieldBubble = null;
      }
      if (a.type === 'double-points') {
        st.doubleActive = false;
        st.doubleCooldown = 0;
        st.doubleBanner = null;
      }
      if (a.type === 'speed-ramp') {
        st.speedRampTimer = 0;
        st.currentSpeed = (currentConfig && currentConfig.speed) || 250;
      }
    });
    ActionSystem.state = st;
    var livesAction = actions.find(function(a){ return a.type === 'lives'; });
    if (livesAction) ActionSystem.buildLivesHUD(scene);
  },

  buildLivesHUD: function(scene: any) {
    var st = ActionSystem.state;
    st.livesObjs = [];
    for (var i = 0; i < st.maxLives; i++) {
      var h = scene.add.text(16 + i * 28, 48, '❤️', {
        fontSize: '20px', fontFamily: 'Arial'
      }).setDepth(30);
      st.livesObjs.push(h);
    }
  },

  updateLivesHUD: function() {
    var st = ActionSystem.state;
    if (st.livesObjs) {
      st.livesObjs.forEach(function(h: any, i: number) {
        h.setAlpha(i < st.lives ? 1 : 0.18);
      });
    }
  },

  // Returns effective speed for this frame (may be increased by speed-ramp)
  tick: function(scene: any, time: number, delta: number, dt: number, heroX: number, heroY: number) {
    var actions = (currentConfig && currentConfig.actions) || [];
    var st = ActionSystem.state;
    var speed = (st.currentSpeed !== undefined) ? st.currentSpeed : ((currentConfig && currentConfig.speed) || 250);
    var isTopDown = currentConfig && currentConfig.template === 'topdown';

    actions.forEach(function(a) {

      // ── Collectible ──────────────────────────────────────────────────────────
      if (a.type === 'collectible' && st.collectibles !== undefined) {
        var interval = (a.params && a.params.spawnInterval) || 4000;
        st.collectibleTimer += delta;
        if (st.collectibleTimer >= interval) {
          st.collectibleTimer = 0;
          ActionSystem.spawnCollectible(scene, a);
        }
        for (var i = st.collectibles.length - 1; i >= 0; i--) {
          var c = st.collectibles[i];
          if (!isTopDown) c.x -= speed * dt; // runner: scroll left
          c.obj.setPosition(c.x, c.y);
          var hit = Math.abs(c.x - heroX) < 32 && Math.abs(c.y - heroY) < 32;
          if (hit) {
            c.obj.destroy();
            st.collectibles.splice(i, 1);
            var pts = (a.params && a.params.points) || 5;
            if (st.doubleActive) pts *= 2;
            scene.score += pts;
            if (scene.scoreTxt) {
              scene.scoreTxt.setText(isTopDown
                ? 'Score: ' + scene.score
                : 'Score: ' + scene.score);
            }
            scene.sounds && scene.sounds.score();
          } else if (!isTopDown && c.x < -80) {
            c.obj.destroy();
            st.collectibles.splice(i, 1);
          }
        }
      }

      // ── Shield ───────────────────────────────────────────────────────────────
      if (a.type === 'shield') {
        var shieldInt = (a.params && a.params.shieldInterval) || 15000;
        if (!st.shieldActive && !st.shieldItem) {
          st.shieldTimer += delta;
          if (st.shieldTimer >= shieldInt) {
            st.shieldTimer = 0;
            ActionSystem.spawnShield(scene);
          }
        }
        if (st.shieldItem) {
          if (!isTopDown) st.shieldItem.x -= speed * dt;
          st.shieldItem.obj.setPosition(st.shieldItem.x, st.shieldItem.y);
          var shHit = Math.abs(st.shieldItem.x - heroX) < 38 && Math.abs(st.shieldItem.y - heroY) < 38;
          if (shHit) {
            st.shieldItem.obj.destroy(); st.shieldItem = null;
            st.shieldActive = true;
            if (st.shieldBubble) st.shieldBubble.destroy();
            st.shieldBubble = scene.add.circle(heroX, heroY, 38, 0x44aaff, 0.28).setDepth(25);
            scene.sounds && scene.sounds.score();
            var dur = (a.params && a.params.duration) || 5000;
            scene.time.delayedCall(dur, function() {
              st.shieldActive = false;
              if (st.shieldBubble) { st.shieldBubble.destroy(); st.shieldBubble = null; }
            });
          } else if (!isTopDown && st.shieldItem.x < -80) {
            st.shieldItem.obj.destroy(); st.shieldItem = null;
          }
        }
        // Keep shield bubble on hero
        if (st.shieldBubble) st.shieldBubble.setPosition(heroX, heroY);
      }

      // ── Double-points ────────────────────────────────────────────────────────
      if (a.type === 'double-points') {
        var doubleInt = (a.params && a.params.doubleInterval) || 20000;
        var doubleDur = (a.params && a.params.doubleDuration) || 5000;
        if (!st.doubleActive) {
          st.doubleCooldown += delta;
          if (st.doubleCooldown >= doubleInt) {
            st.doubleCooldown = 0;
            st.doubleActive = true;
            if (st.doubleBanner) st.doubleBanner.destroy();
            var W2 = window.innerWidth;
            st.doubleBanner = scene.add.text(W2 / 2, 80, '⚡ 2× Points!', {
              fontSize: '22px', fontFamily: 'Arial',
              color: '#ffe000', stroke: '#000', strokeThickness: 3,
            }).setOrigin(0.5).setDepth(28);
            scene.time.delayedCall(doubleDur, function() {
              st.doubleActive = false;
              if (st.doubleBanner) { st.doubleBanner.destroy(); st.doubleBanner = null; }
            });
          }
        }
      }

      // ── Speed-ramp ───────────────────────────────────────────────────────────
      if (a.type === 'speed-ramp') {
        st.speedRampTimer += delta;
        if (st.speedRampTimer >= 10000) {
          st.speedRampTimer = 0;
          var inc = (a.params && a.params.increment) || 30;
          var maxSpd = (a.params && a.params.maxSpeed) || 600;
          st.currentSpeed = Math.min(maxSpd, (st.currentSpeed || (currentConfig && currentConfig.speed) || 250) + inc);
        }
        speed = st.currentSpeed;
      }
    });

    return speed;
  },

  spawnCollectible: function(scene: any, action: any) {
    var W = window.innerWidth, H = window.innerHeight;
    var GROUND_Y = Math.floor(H * 0.78);
    var emoji = (action.params && action.params.spawnEmoji) || '⭐';
    var x: number, y: number;
    if (currentConfig && currentConfig.template === 'topdown') {
      // Spawn at random position on screen (not near edges)
      x = Phaser.Math.Between(60, W - 60);
      y = Phaser.Math.Between(60, H - 60);
    } else {
      // Runner: spawn from right edge at ground level
      x = W + 40;
      y = GROUND_Y - 28;
    }
    var obj = scene.add.text(x, y, emoji, { fontSize: '32px', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(10);
    ActionSystem.state.collectibles.push({ x: x, y: y, obj: obj });
  },

  spawnShield: function(scene: any) {
    var W = window.innerWidth, H = window.innerHeight;
    var GROUND_Y = Math.floor(H * 0.78);
    var x: number, y: number;
    if (currentConfig && currentConfig.template === 'topdown') {
      x = Phaser.Math.Between(60, W - 60);
      y = Phaser.Math.Between(60, H - 60);
    } else {
      x = W + 40;
      y = GROUND_Y - 28;
    }
    var obj = scene.add.text(x, y, '🛡️', { fontSize: '32px', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(10);
    ActionSystem.state.shieldItem = { x: x, y: y, obj: obj };
  },

  // Call on collision. Returns true = game over, false = collision absorbed.
  handleCollision: function(scene: any, hitEnemyObj: any) {
    var actions = (currentConfig && currentConfig.actions) || [];
    var st = ActionSystem.state;

    // Enemy-explode visual (flash the enemy object if provided)
    var hasExplode = actions.some(function(a){ return a.type === 'enemy-explode'; });
    if (hasExplode && hitEnemyObj && scene.tweens) {
      scene.tweens.add({
        targets: hitEnemyObj,
        alpha: 0, scaleX: 1.8, scaleY: 1.8,
        duration: 250, ease: 'Power2',
        onComplete: function(){ if(hitEnemyObj.active) hitEnemyObj.destroy(); }
      });
    }

    // Shield absorbs the hit
    if (st.shieldActive) {
      st.shieldActive = false;
      if (st.shieldBubble) { st.shieldBubble.destroy(); st.shieldBubble = null; }
      scene.sounds && scene.sounds.score();
      return false;
    }

    // Lives system: deduct a life
    var livesAction = actions.find(function(a){ return a.type === 'lives'; });
    if (livesAction && st.lives !== undefined) {
      if (st.isInvincible) return false;
      st.lives = Math.max(0, st.lives - 1);
      ActionSystem.updateLivesHUD();
      if (st.lives <= 0) return true; // game over
      // Brief invincibility + hero flash
      st.isInvincible = true;
      var hero = scene.hero || scene.heroObj;
      if (hero && scene.tweens) {
        scene.tweens.add({
          targets: hero, alpha: 0.2, duration: 100,
          yoyo: true, repeat: 6,
          onComplete: function(){ if(hero.active) hero.setAlpha(1); }
        });
      }
      scene.time.delayedCall(1500, function(){ st.isInvincible = false; });
      scene.sounds && scene.sounds.land && scene.sounds.land();
      return false;
    }

    return true; // default: game over
  },

  destroy: function() {
    var st = ActionSystem.state;
    if (st.collectibles) st.collectibles.forEach(function(c: any){ if(c.obj.active) c.obj.destroy(); });
    if (st.shieldItem && st.shieldItem.obj.active) st.shieldItem.obj.destroy();
    if (st.shieldBubble && st.shieldBubble.active) st.shieldBubble.destroy();
    if (st.doubleBanner && st.doubleBanner.active) st.doubleBanner.destroy();
    if (st.livesObjs) st.livesObjs.forEach(function(h: any){ if(h.active) h.destroy(); });
    ActionSystem.state = {};
  },
};
