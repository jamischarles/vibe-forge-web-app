// ══════════════════════════════════════════════════════════════════════════════
//  SHOOTER MINI-GAME MODES — modular building blocks for objective-based play
//  Currently supports: CTF (capture the flag)
//  Each module (Zones, Objectives, Scoring, AIRoles, Timer) is independently
//  reusable for future modes (KOTH, domination, escort, etc.)
// ══════════════════════════════════════════════════════════════════════════════

// ── Zone System ─────────────────────────────────────────────────────────────
// Named rectangular regions with visual indicators and collision callbacks.

var ZoneSystem = {
  zones: [] as any[],

  createZone: function(scene: any, id: string, x: number, y: number, w: number, h: number, color: number, label: string) {
    // Background fill (low depth, subtle)
    var bg = scene.add.rectangle(x + w/2, y + h/2, w, h, color, 0.18).setDepth(1);
    bg.setStrokeStyle(2, color, 0.5);
    // Label text
    var txt = scene.add.text(x + w/2, y + h/2, label, {
      fontSize: '14px', color: '#fff', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(2).setAlpha(0.7);
    var zone = { id: id, x: x, y: y, w: w, h: h, color: color, bg: bg, txt: txt };
    ZoneSystem.zones.push(zone);
    return zone;
  },

  isInZone: function(zone: any, px: number, py: number) {
    return px >= zone.x && px <= zone.x + zone.w && py >= zone.y && py <= zone.y + zone.h;
  },

  getReservedRects: function() {
    // Returns rects that wall generation should avoid
    return ZoneSystem.zones.map(function(z: any) {
      return { x: z.x - 20, y: z.y - 20, w: z.w + 40, h: z.h + 40 };
    });
  },

  destroy: function() {
    ZoneSystem.zones.forEach(function(z: any) {
      if (z.bg && z.bg.active) z.bg.destroy();
      if (z.txt && z.txt.active) z.txt.destroy();
    });
    ZoneSystem.zones = [];
  },
};

// ── Objective System ────────────────────────────────────────────────────────
// Carriable items (flags) that can be picked up, carried, dropped, and returned.

var ObjectiveSystem = {
  objectives: [] as any[],

  createObjective: function(scene: any, id: string, homeX: number, homeY: number, emoji: string, color: number) {
    var obj = scene.add.text(homeX, homeY, emoji, {
      fontSize: '28px', fontFamily: 'Arial',
    }).setOrigin(0.5).setDepth(10);
    // Bobbing animation when at home
    var bobTween = scene.tweens.add({
      targets: obj, y: homeY - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    // Glow ring under flag
    var glow = scene.add.circle(homeX, homeY, 18, color, 0.3).setDepth(9);
    scene.tweens.add({
      targets: glow, scaleX: 1.3, scaleY: 1.3, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });

    var objective: any = {
      id: id,
      homeX: homeX, homeY: homeY,
      x: homeX, y: homeY,
      emoji: emoji, color: color,
      obj: obj, glow: glow, bobTween: bobTween,
      state: 'home',       // 'home' | 'carried' | 'dropped'
      carrier: null,        // reference to enemy or 'hero'
      dropTimer: 0,         // ms since dropped (auto-return after timeout)
    };
    ObjectiveSystem.objectives.push(objective);
    return objective;
  },

  pickup: function(scene: any, objective: any, carrier: any) {
    if (objective.state === 'carried') return;
    objective.state = 'carried';
    objective.carrier = carrier;
    objective.dropTimer = 0;
    // Stop bobbing, attach to carrier
    if (objective.bobTween) objective.bobTween.stop();
    if (objective.glow && objective.glow.active) { objective.glow.setAlpha(0); }
  },

  drop: function(scene: any, objective: any, x: number, y: number) {
    objective.state = 'dropped';
    objective.carrier = null;
    objective.x = x; objective.y = y;
    objective.dropTimer = 0;
    objective.obj.setPosition(x, y);
    if (objective.glow && objective.glow.active) {
      objective.glow.setPosition(x, y).setAlpha(0.3);
    }
    // Restart bobbing at drop location
    objective.bobTween = scene.tweens.add({
      targets: objective.obj, y: y - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  },

  returnHome: function(scene: any, objective: any) {
    objective.state = 'home';
    objective.carrier = null;
    objective.dropTimer = 0;
    objective.x = objective.homeX;
    objective.y = objective.homeY;
    objective.obj.setPosition(objective.homeX, objective.homeY);
    if (objective.glow && objective.glow.active) {
      objective.glow.setPosition(objective.homeX, objective.homeY).setAlpha(0.3);
    }
    if (objective.bobTween) objective.bobTween.stop();
    objective.bobTween = scene.tweens.add({
      targets: objective.obj, y: objective.homeY - 6, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
    // Return flash effect
    var flash = scene.add.circle(objective.homeX, objective.homeY, 24, objective.color, 0.7).setDepth(15);
    scene.tweens.add({ targets: flash, scaleX: 3, scaleY: 3, alpha: 0, duration: 500,
      onComplete: function() { if (flash.active) flash.destroy(); } });
  },

  update: function(scene: any, dt: number, heroX: number, heroY: number) {
    for (var i = 0; i < ObjectiveSystem.objectives.length; i++) {
      var o = ObjectiveSystem.objectives[i];
      if (o.state === 'carried' && o.carrier) {
        // Follow carrier
        if (o.carrier === 'hero') {
          o.x = heroX; o.y = heroY - 22; // float above hero
        } else {
          o.x = o.carrier.x; o.y = o.carrier.y - 22;
        }
        o.obj.setPosition(o.x, o.y);
        if (o.glow && o.glow.active) o.glow.setPosition(o.x, o.y + 22);
      } else if (o.state === 'dropped') {
        // Auto-return after 15 seconds
        o.dropTimer += dt * 1000;
        if (o.dropTimer >= 15000) {
          ObjectiveSystem.returnHome(scene, o);
        }
      }
    }
  },

  getById: function(id: string) {
    for (var i = 0; i < ObjectiveSystem.objectives.length; i++) {
      if (ObjectiveSystem.objectives[i].id === id) return ObjectiveSystem.objectives[i];
    }
    return null;
  },

  destroy: function() {
    ObjectiveSystem.objectives.forEach(function(o: any) {
      if (o.obj && o.obj.active) o.obj.destroy();
      if (o.glow && o.glow.active) o.glow.destroy();
      if (o.bobTween) o.bobTween.stop();
    });
    ObjectiveSystem.objectives = [];
  },
};

// ── Match Scoring ───────────────────────────────────────────────────────────
// Tracks captures toward a win threshold.

var MatchScoring = {
  heroScore: 0,
  enemyScore: 0,
  captureLimit: 3,
  scoreTxt: null as any,
  winner: null as string | null,

  init: function(scene: any, captureLimit: number) {
    MatchScoring.heroScore = 0;
    MatchScoring.enemyScore = 0;
    MatchScoring.captureLimit = captureLimit;
    MatchScoring.winner = null;
    var W = scene.cameras.main.width;
    MatchScoring.scoreTxt = scene.add.text(W / 2, 46, '🔵 0 — 0 🔴', {
      fontSize: '22px', color: '#fff', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5, 0).setDepth(56);
  },

  heroCapture: function(scene: any) {
    MatchScoring.heroScore++;
    MatchScoring.updateDisplay();
    // Celebration banner
    var W = scene.cameras.main.width;
    var banner = scene.add.text(W / 2, scene.cameras.main.height * 0.35, '🏆 FLAG CAPTURED!', {
      fontSize: '28px', color: '#44ddff', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(57);
    scene.tweens.add({ targets: banner, alpha: 0, y: banner.y - 40, delay: 1500, duration: 600,
      onComplete: function() { if (banner.active) banner.destroy(); } });
    if (MatchScoring.heroScore >= MatchScoring.captureLimit) {
      MatchScoring.winner = 'hero';
    }
  },

  enemyCapture: function(scene: any) {
    MatchScoring.enemyScore++;
    MatchScoring.updateDisplay();
    var W = scene.cameras.main.width;
    var banner = scene.add.text(W / 2, scene.cameras.main.height * 0.35, '⚠️ ENEMY CAPTURED YOUR FLAG!', {
      fontSize: '24px', color: '#ff4444', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(57);
    scene.tweens.add({ targets: banner, alpha: 0, y: banner.y - 40, delay: 1500, duration: 600,
      onComplete: function() { if (banner.active) banner.destroy(); } });
    if (MatchScoring.enemyScore >= MatchScoring.captureLimit) {
      MatchScoring.winner = 'enemy';
    }
  },

  updateDisplay: function() {
    if (MatchScoring.scoreTxt) {
      MatchScoring.scoreTxt.setText('🔵 ' + MatchScoring.heroScore + ' — ' + MatchScoring.enemyScore + ' 🔴');
    }
  },

  destroy: function() {
    if (MatchScoring.scoreTxt && MatchScoring.scoreTxt.active) MatchScoring.scoreTxt.destroy();
    MatchScoring.scoreTxt = null;
    MatchScoring.winner = null;
  },
};

// ── AI Roles ────────────────────────────────────────────────────────────────
// Extends existing enemy AI with objective-aware behavior.
// Roles redirect targeting within the existing patrol/alert/shoot/cover states.

var AIRoles = {
  defenderRatio: 0.5,

  assignRole: function(enemy: any, modeState: any) {
    // Defenders guard the enemy flag; attackers go for the hero flag
    var defenders = 0, total = 0;
    if (modeState && modeState.enemies) {
      for (var i = 0; i < modeState.enemies.length; i++) {
        total++;
        if (modeState.enemies[i].aiRole === 'defend') defenders++;
      }
    }
    var needDefenders = total > 0 && (defenders / total) < AIRoles.defenderRatio;
    enemy.aiRole = needDefenders ? 'defend' : 'capture';
    modeState.enemies = modeState.enemies || [];
    modeState.enemies.push(enemy);
  },

  // Returns overridden target position for an enemy based on its role.
  // Returns null to use default hero-targeting.
  getTarget: function(enemy: any, modeState: any, heroX: number, heroY: number) {
    if (!modeState) return null;

    if (enemy.aiRole === 'defend') {
      var enemyFlag = ObjectiveSystem.getById('enemyFlag');
      if (!enemyFlag) return null;
      // If hero is carrying our flag, prioritize intercepting hero
      if (enemyFlag.state === 'carried' && enemyFlag.carrier === 'hero') {
        return { x: heroX, y: heroY, alertRange: 9999, urgent: true };
      }
      // Otherwise patrol near our flag
      return { x: enemyFlag.x, y: enemyFlag.y, alertRange: 200, urgent: false };
    }

    if (enemy.aiRole === 'capture') {
      var heroFlag = ObjectiveSystem.getById('heroFlag');
      if (!heroFlag) return null;
      // If carrying the flag, run home
      if (enemy.carrying) {
        var enemyBase: any = null;
        for (var i = 0; i < ZoneSystem.zones.length; i++) {
          if (ZoneSystem.zones[i].id === 'enemyBase') { enemyBase = ZoneSystem.zones[i]; break; }
        }
        if (enemyBase) {
          return {
            x: enemyBase.x + enemyBase.w / 2,
            y: enemyBase.y + enemyBase.h / 2,
            alertRange: 80, urgent: true, fleeing: true,
          };
        }
      }
      // Go for the hero flag
      if (heroFlag.state === 'home' || heroFlag.state === 'dropped') {
        return { x: heroFlag.x, y: heroFlag.y, alertRange: 300, urgent: false };
      }
      // Flag is already being carried by another enemy — fall back to default
      return null;
    }

    return null;
  },

  removeEnemy: function(enemy: any, modeState: any) {
    if (modeState && modeState.enemies) {
      var idx = modeState.enemies.indexOf(enemy);
      if (idx >= 0) modeState.enemies.splice(idx, 1);
    }
  },
};

// ── Match Timer ─────────────────────────────────────────────────────────────
// Optional countdown timer for timed matches.

var MatchTimer = {
  remaining: 0,       // seconds
  enabled: false,
  timerTxt: null as any,

  init: function(scene: any, timeLimit: number) {
    MatchTimer.remaining = timeLimit;
    MatchTimer.enabled = timeLimit > 0;
    if (!MatchTimer.enabled) return;
    var W = scene.cameras.main.width;
    MatchTimer.timerTxt = scene.add.text(W / 2, 72, MatchTimer.formatTime(timeLimit), {
      fontSize: '18px', color: '#ffcc00', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5, 0).setDepth(56);
  },

  update: function(dt: number) {
    if (!MatchTimer.enabled) return;
    MatchTimer.remaining = Math.max(0, MatchTimer.remaining - dt);
    if (MatchTimer.timerTxt) {
      MatchTimer.timerTxt.setText(MatchTimer.formatTime(Math.ceil(MatchTimer.remaining)));
    }
  },

  isExpired: function() {
    return MatchTimer.enabled && MatchTimer.remaining <= 0;
  },

  formatTime: function(s: number) {
    var m = Math.floor(s / 60);
    var sec = s % 60;
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  },

  destroy: function() {
    if (MatchTimer.timerTxt && MatchTimer.timerTxt.active) MatchTimer.timerTxt.destroy();
    MatchTimer.timerTxt = null;
    MatchTimer.enabled = false;
  },
};

// ══════════════════════════════════════════════════════════════════════════════
//  CTF Mode — wires the 5 modules together
// ══════════════════════════════════════════════════════════════════════════════

function initCTFMode(scene: any, SC: any) {
  var W = scene.cameras.main.width;
  var H = scene.cameras.main.height;
  var mc = SC.modeConfig || {};
  var captureLimit = Math.max(1, Math.min(10, mc.captureLimit || 3));
  var timeLimit    = mc.timeLimit !== undefined ? mc.timeLimit : 180;
  AIRoles.defenderRatio = Math.max(0, Math.min(1, mc.defenderRatio || 0.5));

  // Zone dimensions — sized relative to arena
  var zoneW = Math.max(100, Math.min(180, W * 0.18));
  var zoneH = Math.max(80,  Math.min(140, H * 0.2));

  // Hero base: bottom-center
  var heroBaseX = W / 2 - zoneW / 2;
  var heroBaseY = H - zoneH - 20;
  var heroBase = ZoneSystem.createZone(scene, 'heroBase', heroBaseX, heroBaseY, zoneW, zoneH, 0x3388ff, '🔵 YOUR BASE');

  // Enemy base: top-center
  var enemyBaseX = W / 2 - zoneW / 2;
  var enemyBaseY = 20;
  var enemyBase = ZoneSystem.createZone(scene, 'enemyBase', enemyBaseX, enemyBaseY, zoneW, zoneH, 0xff3333, '🔴 ENEMY BASE');

  // Flags — hero flag at hero base, enemy flag at enemy base
  var heroFlagX  = heroBaseX + zoneW / 2;
  var heroFlagY  = heroBaseY + zoneH / 2;
  var enemyFlagX = enemyBaseX + zoneW / 2;
  var enemyFlagY = enemyBaseY + zoneH / 2;

  var heroFlag  = ObjectiveSystem.createObjective(scene, 'heroFlag',  heroFlagX,  heroFlagY,  '🏳️', 0x3388ff);
  var enemyFlag = ObjectiveSystem.createObjective(scene, 'enemyFlag', enemyFlagX, enemyFlagY, '🚩', 0xff3333);

  MatchScoring.init(scene, captureLimit);
  MatchTimer.init(scene, timeLimit);

  // Flag status HUD
  var statusTxt = scene.add.text(W / 2, 96, '', {
    fontSize: '13px', color: '#ccc', stroke: '#000', strokeThickness: 2,
  }).setOrigin(0.5, 0).setDepth(56);

  // Pickup banner on flag grab
  var grabBanner: any = null;

  var modeState: any = {
    enemies: [],   // tracked for role assignment
    heroBase: heroBase,
    enemyBase: enemyBase,
    heroFlag: heroFlag,
    enemyFlag: enemyFlag,
    statusTxt: statusTxt,
    grabBanner: grabBanner,

    update: function(scn: any, dt: number, gameDt: number, heroX: number, heroY: number, heroRadius: number, enemies: any[]) {
      ObjectiveSystem.update(scn, dt, heroX, heroY);
      MatchTimer.update(dt);

      // ── Hero picks up enemy flag ─────────────────────────────────
      if (enemyFlag.state !== 'carried') {
        var fdx = heroX - enemyFlag.x, fdy = heroY - enemyFlag.y;
        if (fdx * fdx + fdy * fdy < (heroRadius + 16) * (heroRadius + 16)) {
          ObjectiveSystem.pickup(scn, enemyFlag, 'hero');
          scn.sounds && scn.sounds.score && scn.sounds.score();
          // Show banner
          if (modeState.grabBanner && modeState.grabBanner.active) modeState.grabBanner.destroy();
          modeState.grabBanner = scn.add.text(W / 2, H * 0.28, '🚩 GOT THE FLAG! Return to base!', {
            fontSize: '22px', color: '#ffee44', stroke: '#000', strokeThickness: 4,
          }).setOrigin(0.5).setDepth(57);
          scn.tweens.add({ targets: modeState.grabBanner, alpha: 0, y: H * 0.22, delay: 2000, duration: 600,
            onComplete: function() { if (modeState.grabBanner && modeState.grabBanner.active) modeState.grabBanner.destroy(); } });
        }
      }

      // ── Hero captures: deliver enemy flag to hero base ───────────
      if (enemyFlag.state === 'carried' && enemyFlag.carrier === 'hero') {
        if (ZoneSystem.isInZone(heroBase, heroX, heroY)) {
          MatchScoring.heroCapture(scn);
          ObjectiveSystem.returnHome(scn, enemyFlag);
          scn.sounds && scn.sounds.score && scn.sounds.score();
        }
      }

      // ── Enemies pick up hero flag ────────────────────────────────
      if (heroFlag.state !== 'carried') {
        for (var ei = 0; ei < enemies.length; ei++) {
          var e = enemies[ei];
          if (e.aiRole !== 'capture' || e.carrying) continue;
          var edx = e.x - heroFlag.x, edy = e.y - heroFlag.y;
          var er = (e.radius || 18) + 16;
          if (edx * edx + edy * edy < er * er) {
            ObjectiveSystem.pickup(scn, heroFlag, e);
            e.carrying = heroFlag;
            break;
          }
        }
      }

      // ── Enemy captures: deliver hero flag to enemy base ──────────
      for (var ci = 0; ci < enemies.length; ci++) {
        var ce = enemies[ci];
        if (!ce.carrying) continue;
        if (ZoneSystem.isInZone(enemyBase, ce.x, ce.y)) {
          MatchScoring.enemyCapture(scn);
          ObjectiveSystem.returnHome(scn, ce.carrying);
          ce.carrying = null;
        }
      }

      // ── Hero touches own dropped flag → return it home ───────────
      if (heroFlag.state === 'dropped') {
        var rdx = heroX - heroFlag.x, rdy = heroY - heroFlag.y;
        if (rdx * rdx + rdy * rdy < (heroRadius + 16) * (heroRadius + 16)) {
          ObjectiveSystem.returnHome(scn, heroFlag);
          scn.sounds && scn.sounds.score && scn.sounds.score();
        }
      }

      // ── Flag status display ──────────────────────────────────────
      var heroFlagStatus  = heroFlag.state === 'home' ? 'At Base' : heroFlag.state === 'carried' ? 'STOLEN!' : 'Dropped';
      var enemyFlagStatus = enemyFlag.state === 'home' ? 'At Base' : enemyFlag.state === 'carried' ? 'YOU HAVE IT' : 'Dropped';
      if (statusTxt && statusTxt.active) {
        statusTxt.setText('Your Flag: ' + heroFlagStatus + '  |  Enemy Flag: ' + enemyFlagStatus);
      }

      // ── Win/loss check ───────────────────────────────────────────
      if (MatchScoring.winner === 'hero') {
        return 'victory';
      }
      if (MatchScoring.winner === 'enemy') {
        return 'defeat';
      }
      if (MatchTimer.isExpired()) {
        if (MatchScoring.heroScore > MatchScoring.enemyScore) return 'victory';
        if (MatchScoring.enemyScore > MatchScoring.heroScore) return 'defeat';
        return 'defeat'; // tie = loss (adds urgency)
      }
      return null;
    },

    onEnemyDeath: function(scn: any, enemy: any) {
      // Drop flag if carrier dies
      if (enemy.carrying) {
        ObjectiveSystem.drop(scn, enemy.carrying, enemy.x, enemy.y);
        enemy.carrying = null;
      }
      AIRoles.removeEnemy(enemy, modeState);
    },

    onHeroDeath: function(scn: any, heroX: number, heroY: number) {
      // Drop enemy flag if hero was carrying it
      if (enemyFlag.state === 'carried' && enemyFlag.carrier === 'hero') {
        ObjectiveSystem.drop(scn, enemyFlag, heroX, heroY);
      }
    },

    destroy: function() {
      ZoneSystem.destroy();
      ObjectiveSystem.destroy();
      MatchScoring.destroy();
      MatchTimer.destroy();
      if (modeState.grabBanner && modeState.grabBanner.active) modeState.grabBanner.destroy();
      if (statusTxt && statusTxt.active) statusTxt.destroy();
      modeState.enemies = [];
    },
  };

  return modeState;
}

// ══════════════════════════════════════════════════════════════════════════════
//  Public entry point — called from shooter.ts create()
// ══════════════════════════════════════════════════════════════════════════════

function initGameMode(scene: any, SC: any) {
  var mode = SC.gameMode || 'deathmatch';
  if (mode === 'ctf') {
    return initCTFMode(scene, SC);
  }
  // 'deathmatch' or unknown → no mode system (classic behavior)
  return null;
}
