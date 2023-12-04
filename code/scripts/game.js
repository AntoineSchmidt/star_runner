var Game = function Game(ctx, width, height, doneCallback) {
  this.ctx = ctx;
  this.WIDTH = width;
  this.HEIGHT = height;

  this.STATES = {
    STARTING: 0,
    LOADING_LEVEL: 1,
    PLAYING_LEVEL: 2
  };

  this.state = this.STATES.STARTING;
  this.currentLevel = 0;
  this.levelRoot = 'levels/';

  var that = this;
  this.keyboard = new Keyboard(function (action, isPress) {
    that.handleAction(action, isPress);
  });

  this.player = new Player(function (action, data) {
    that.handleAction(action, data);
  });

  $.getJSON(this.levelRoot + 'level.json', function (levelInfo) {
    that.levels = levelInfo.levels;

    // loading all game assets
    var o;
    that.assets = {};
    console.log('Loading assets');
    for (var i = 0; i < levelInfo.assets.length; i++) {
      o = levelInfo.assets[i];
      var loaded = [];
      for (var j = 0; j < o.src.length; j++) {
        var img = new Image();
        img.src = o.src[j];
        loaded.push(img);
      }
      that.assets[o.id] = loaded;
    }
    that.assets_sounds = {};
    for (var i = 0; i < levelInfo.assets_sounds.length; i++) {
      o = levelInfo.assets_sounds[i];
      var loaded = [];
      for (var j = 0; j < o.src.length; j++) {
        loaded.push(new Audio(o.src[j]));
      }
      that.assets_sounds[o.id] = loaded;
    }

    that.loadLevel(0, function () {
      doneCallback();
    });
  });
}

Game.prototype.beatTheGame = function () {
  alert('You beat the game! (only one level for now)');
  window.location.reload();
}

Game.prototype.loadLevel = function (increment, callback) {
  this.currentLevel += increment;
  this.STATE = this.STATES.LOADING_LEVEL;

  var level = this.levels[this.currentLevel];

  if (!level) { return this.beatTheGame(); }
  console.log('Loading level "' + level + '"...');

  // play intro music
  if (this.currentLevel == 0) { this.assets_sounds.a[1].play(); }

  var that = this;
  $.getJSON(this.levelRoot + level + '.json', function (levelData) {
    console.log(levelData);

    // create empty arrays if not existing
    if (!("background" in levelData)) { levelData.background = []; }
    if (!("solids" in levelData)) { levelData.background = []; }
    if (!("stars" in levelData)) { levelData.background = []; }
    if (!("enemys" in levelData)) { levelData.background = []; }

    that.world = new World(levelData, function (action, data) {
      that.handleAction(action, data);
    });
    that.enemys = new Enemys(levelData.enemys, that.world);
    that.player.setProperties(levelData.player, that.world, that.enemys);

    // For frame rate calculation
    that.frameRate = 60;
    that.frames = 0;
    that.framesTime = Date.now();

    that.start = Date.now();
    that.STATE = that.STATES.PLAYING_LEVEL;
    console.log('Level started');

    // start game loop
    if (typeof callback === 'function') { callback(); }
  });
}

/**
 * Draws player statistic (UI)
 */
Game.prototype.draw = function () {
  // Draw UI box
  this.ctx.beginPath();
  this.ctx.rect(0 * this.WIDTH, 20 * this.HEIGHT, 30 * this.WIDTH, 2 * this.HEIGHT);
  this.ctx.fillStyle = '#222';
  this.ctx.fill();

  this.ctx.fillStyle = '#f2f3f4';
  this.ctx.font = this.HEIGHT + 'px Monospace';

  // Print level
  this.ctx.fillText('LEVEL', this.WIDTH, 21.5 * this.HEIGHT);
  this.ctx.fillText(this.currentLevel, 5 * this.WIDTH, 21.5 * this.HEIGHT);

  // Print score
  this.ctx.fillText('SCORE', 10 * this.WIDTH, 21.5 * this.HEIGHT);
  this.ctx.fillText(this.player.getScore(), 14 * this.WIDTH, 21.5 * this.HEIGHT);

  // Draw hearts
  this.ctx.save();
  for (var i = 0; i < 3; i++) {
    if (!(i < this.player.getLifes())) { this.ctx.globalAlpha = 0.25; }
    this.ctx.drawImage(this.assets.h[0], (19 + i) * this.WIDTH, 20.5 * this.HEIGHT, this.WIDTH, this.HEIGHT);
  }
  this.ctx.restore();
}

/**
 * Draw next frame
 */
Game.prototype.update = function (delta) {
  if (this.STATE !== this.STATES.PLAYING_LEVEL) { return; }

  // Clear canvas
  this.ctx.clearRect(0, 0, 30 * this.WIDTH, 22 * this.HEIGHT);

  // Update objects
  this.world.update(delta);
  this.enemys.update(delta);
  this.player.update(delta, this.assets_sounds);

  // Draw everything
  this.world.draw(this.ctx, this.WIDTH, this.HEIGHT, this.assets);
  this.enemys.draw(this.ctx, this.WIDTH, this.HEIGHT, this.assets);
  this.player.draw(this.ctx, this.WIDTH, this.HEIGHT, this.assets);

  // Draw UI
  this.draw();

  if (this.currentLevel == 0) {
    // Draw Message
    this.ctx.fillStyle = '#AF0000';
    this.ctx.font = this.HEIGHT + 'px Monospace';
    this.ctx.fillText('Use Firefox/Chrome', 16.5 * this.WIDTH, 14 * this.HEIGHT);
    this.ctx.fillText(' to play properly', 16.5 * this.WIDTH, 15 * this.HEIGHT);
  }

  this.lastTick = Date.now();
}

Game.prototype.getFrameRate = function () {
  if (this.frames++ > 10) {
    var now = Date.now();
    this.frameRate = Math.floor(this.frames / (now - this.framesTime) * 1000);
    this.framesTime = Date.now();
    this.frames = 0;
  }
  return this.frameRate;
}

Game.prototype.handleAction = function (action, data) {
  if (this.STATE !== this.STATES.PLAYING_LEVEL) { return; }

  if (action === 'up') { this.player.up(data); return; }
  if (action === 'left') { this.player.left(data); return; }
  if (action === 'down') { this.player.down(data); return; }
  if (action === 'right') { this.player.right(data); return; }

  console.log('Action: ', action, data);
  if (action === 'die') {
    this.player.decrementLifes();
    if (this.player.getLifes() > 0) { this.loadLevel(0); }
    else { window.location.reload(); }
    return;
  }
  if (action === 'collect') {
    this.player.updateScore(data[0]);
    if (this.world.collectStar(data[1]) <= 0) {
      this.loadLevel(1);
    }
    return;
  }
  if (action === 'vanish') {
    this.world.triggerVanishing(data);
    return;
  }
  if (action === 'win') {
    this.loadLevel(1);
    return;
  }
}