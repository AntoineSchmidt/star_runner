var World = function World(levelData, actionCallback) {
  this.levelData = levelData;
  this.actionCallback = actionCallback;
  this.updateMap = true;

  // preparing star timer for vanish stars
  for (var i = 0; i < this.levelData.stars.length; i++) {
    o = this.levelData.stars[i];
    if ("timer" in o) {
      if (o.id == 4) { // normal star, delete timer
        delete o.timer;
      } else {
        o.timer = [o.timer * 1000, o.timer * 1000];
      }
    } else if (o.id == 5) { // vanish stars without timer, set default time
      o.timer = [10000, 10000];
    }
  }
}

World.prototype.buildMap = function () {
  this.map = new Array(30);
  for (var i = 0; i < this.map.length; i++) { this.map[i] = new Array(20).fill(0); }

  var o;
  for (var i = 0; i < this.levelData.solids.length; i++) {
    o = this.levelData.solids[i];
    this.map[o.pos[0]][o.pos[1]] = o.id;
  }
  for (var i = 0; i < this.levelData.stars.length; i++) {
    o = this.levelData.stars[i];
    if (!("collected" in o)) {
      this.map[o.pos[0]][o.pos[1]] = o.id;
    }
  }
}

World.prototype.update = function (delta) {
  if (this.updateMap) {
    this.buildMap();
    this.updateMap = false;
  }

  var o;
  // vanish blocks
  var deleteBlocks = [];
  for (var i = 0; i < this.levelData.solids.length; i++) {
    o = this.levelData.solids[i];
    if ("timer" in o) {
      o.timer[0] -= delta * (o.timer[1] / o.timer[0]);
      if (o.timer[0] <= 0) {
        // delete block
        deleteBlocks.push(i);
      }
    }
  }
  for (var i = 0; i < deleteBlocks.length; i++) {
    this.levelData.solids.splice(deleteBlocks[i], 1);
  }

  // vanish stars, count remaining
  var deleteStars = [];
  var remainingStars = 0;
  for (var i = 0; i < this.levelData.stars.length; i++) {
    o = this.levelData.stars[i];
    if ("timer" in o) {
      o.timer[0] -= delta * (o.timer[1] / o.timer[0]);
      if (o.timer[0] <= 0) {
        // delete star
        deleteStars.push(i);
      }
    }
  }
  for (var i = 0; i < deleteStars.length; i++) {
    this.levelData.stars.splice(deleteStars[i], 1);
  }

  // in case last remaining star vanishes away
  if (this.countStars() <= 0) {
    this.actionCallback("win", undefined);
  }

  // trigger map update
  if (deleteBlocks.length > 0 || deleteStars.length > 0) {
    this.updateMap = true;
  }

  // change background asset used

}

World.prototype.draw = function (ctx, width, height, assets) {
  var o;

  // draw all artworks
  for (var i = 0; i < this.levelData.background.length; i++) {
    o = this.levelData.background[i];
    sprite_id = Math.min(2, assets[o.id].length-1); // hack
    size = assets[o.id][sprite_id].width / assets[o.id][sprite_id].height;
    ctx.drawImage(assets[o.id][sprite_id], width * o.pos[0], height * o.pos[1], width * o.height * size, height * o.height);
  }

  // draw all solids
  ctx.save();
  for (var i = 0; i < this.levelData.solids.length; i++) {
    o = this.levelData.solids[i];
    if ("timer" in o) { ctx.globalAlpha = Math.max(o.timer[0] / o.timer[1], 0); }
    else { ctx.globalAlpha = 1; }
    ctx.drawImage(assets[o.id][0], width * o.pos[0], height * o.pos[1], width, height);
  }

  // draw all stars
  for (var i = 0; i < this.levelData.stars.length; i++) {
    o = this.levelData.stars[i];
    if ("timer" in o) { ctx.globalAlpha = Math.max(o.timer[0] / o.timer[1], 0); }
    else { ctx.globalAlpha = 1; }
    sprite_id = "collected" in o ? 1 : 0;
    ctx.drawImage(assets[o.id][sprite_id], width * o.pos[0], height * o.pos[1], width, height);
  }
  ctx.restore();
}

World.prototype.countStars = function () {
  remaining_stars = 0;
  for (var i = 0; i < this.levelData.stars.length; i++) {
    if (!("collected" in this.levelData.stars[i])) { remaining_stars += 1; }
  }
  return remaining_stars;
}

/**
 * removes star from level
 * calls for map update
 * @param array star-position
 * @return number of remaining stars
 */
World.prototype.collectStar = function (position) {
  for (var i = 0; i < this.levelData.stars.length; i++) {
    o = this.levelData.stars[i];
    if (o.pos[0] == position[0] && o.pos[1] == position[1]) {
      o.collected = true; // actual value not important
      o.timer = [500, 500];
      this.updateMap = true;
      break
    }
  }
  // count remaining
  return this.countStars();
}

/**
 * Initialises block vanishing
 */
World.prototype.triggerVanishing = function (position) {
  for (var i = 0; i < this.levelData.solids.length; i++) {
    o = this.levelData.solids[i];
    if (o.pos[0] == position[0] && o.pos[1] == (position[1] + 1)) {
      if (!("timer" in o)) {
        // current timer and timer max (for alpha)
        o.timer = [1000, 1000];
      }
      break
    }
  }
}

/**
 * asked position centered
 * default to solid block for map borders
 * @return surrounding objects from map
 */
World.prototype.getSurrounding = function (pos) {
  var surrounding = new Array(3);
  for (var i = 0; i < surrounding.length; i++) { surrounding[i] = new Array(3).fill(1); }

  for (var dx = -1; dx < 2; dx++) {
    for (var dy = -1; dy < 2; dy++) {
      posMap = [pos[0] + dx, pos[1] + dy];
      if (posMap[0] >= 0 && posMap[0] < 30 && posMap[1] >= 0) {
        if (posMap[1] < 20) { // on map
          surrounding[dx + 1][dy + 1] = this.map[posMap[0]][posMap[1]];
        } else { // location of ui, fall and die behind ui
          surrounding[dx + 1][dy + 1] = 0;
        }
      }
    }
  }
  return surrounding;
}