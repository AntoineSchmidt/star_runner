var Enemys = function Enemys(enemyData, world) {
  this.VELOCITY = 0.005; // per delta

  this.enemyData = enemyData;
  this.world = world;
  this.updatePathes = true;

  // add target and direction cache
  for (var i = 0; i < this.enemyData.length; i++) {
    this.enemyData[i].target = [0, 0];
    if (this.enemyData[i].id == 7) {
      this.enemyData[i].horizontal = true;
    }
  }
}

Enemys.prototype.generatePathes = function () {
  this.pathes = {
    "h": [], // horizontal pathes [[y, x1, x2, ...],...] where x1 < x2 (left to right)
    "v": []  // vertical   pathes [[x, y1, y2, ...],...] where y1 < y2 (top to bottom)
  }

  // all horizontal pathes
  for (var y = 0; y < (this.world.map[0].length - 1); y++) {
    path = [y, -1];
    for (var x = 0; x < this.world.map.length; x++) {
      // free or ladder position with ladder or block as ground
      if (this.world.map[x][y] != 1 && this.world.map[x][y] != 2 && (this.world.map[x][y + 1] == 1 || this.world.map[x][y + 1] == 3)) {
        path[path.length - 1] = x;
        if (this.world.map[x][y] == 3 || this.world.map[x][y + 1] == 3 || path.length < 3) { path.push(-1); } // current position is junction or path starts
      } else { // path interrupted
        if (path.length > 2) {
          // save path
          path_end = path.length;
          if (path[path_end - 1] < 0) { path_end -= 1; }
          if (path_end > 2) { this.pathes.h.push(path.slice(0, path_end)); }
        }
        // reset path
        path = [y, -1];
      }
    }
    if (path.length > 2) {
      // save path
      path_end = path.length;
      if (path[path_end - 1] < 0) { path_end -= 1; }
      if (path_end > 2) { this.pathes.h.push(path.slice(0, path_end)); }
    }
  }

  // all vertical pathes
  for (var x = 0; x < this.world.map.length; x++) {
    path = [x, -1];
    for (var y = 0; y < this.world.map[x].length; y++) {
      // ladder on position <or> free position with ladder as ground
      if (this.world.map[x][y] == 3 || (this.world.map[x][y] != 1 && this.world.map[x][y] != 2 && this.world.map[x][y + 1] == 3)) {
        path[path.length - 1] = y;
        if ((x > 0 && y < 19 && this.world.map[x - 1][y + 1] == 1 && this.world.map[x - 1][y] != 1 && this.world.map[x - 1][y] != 2) || // accessible platform on the left
          (x < 19 && y < 19 && this.world.map[x + 1][y + 1] == 1 && this.world.map[x + 1][y] != 1 && this.world.map[x + 1][y] != 2) || // accessible platform on the right
          (path.length < 3)) { // path starts
          path.push(-1);
        }
      } else { // path interrupted
        if (path.length > 2) {
          // save path
          path_end = path.length;
          if (path[path_end - 1] < 0) { path_end -= 1; }
          if (path_end > 2) { this.pathes.v.push(path.slice(0, path_end)); }
        }
        // reset path
        path = [x, -1];
      }
    }
    if (path.length > 2) {
      // save path
      path_end = path.length;
      if (path[path_end - 1] < 0) { path_end -= 1; }
      if (path_end > 2) { this.pathes.v.push(path.slice(0, path_end)); }
    }
  }
  console.log(this.pathes);
}

Enemys.prototype.update = function (delta) {
  if (this.updatePathes) {
    this.generatePathes();
    this.updatePathes = false;
  }

  // move all enemys 
  for (var i = 0; i < this.enemyData.length; i++) {
    o = this.enemyData[i];

    // target reached, select new target
    path_found = false;
    if (o.target[0] == 0 && o.target[1] == 0) {
      if (o.id == 6 || o.horizontal) { // normal enemy or horizontal
        for (var j = 0; j < this.pathes.h.length; j++) {
          path = this.pathes.h[j];
          if (o.pos[1] == path[0]) { // matching floor
            if (path[1] <= o.pos[0] && path[path.length - 1] >= o.pos[0]) { // matching path
              targets = [];
              for (var x = 1; x < path.length; x++) { // collect all non-zero targets
                target_dist = path[x] - o.pos[0];
                if (target_dist != 0) { targets.push(target_dist); }
              }
              if (o.id == 7) { // if smart enemy randomly select next target
                o.target[0] = targets[Math.floor(Math.random() * targets.length)];
                o.horizontal = false;
              } else { // if normal enemy randomly select max left or right target
                selected_target = 0;
                if (targets.length > 1) {
                  direction = Math.floor(Math.random() * 2);
                  if (direction == 0 && targets[0] > 0) {
                    selected_target = targets.length - 1;
                  } else if (direction == 1 && targets[targets.length - 1] < 0) {
                    selected_target = 0;
                  } else {
                    selected_target = direction * (targets.length - 1);
                  }
                }
                o.target[0] = targets[selected_target];
              }
              path_found = true;
              break;
            }
          }
        }
      }
      if (o.id == 7 && !path_found) { // smart enemy, next move vertical or no horizontal path found
        for (var j = 0; j < this.pathes.v.length; j++) {
          path = this.pathes.v[j];
          if (o.pos[0] == path[0]) { // matching column
            if (path[1] <= o.pos[1] && path[path.length - 1] >= o.pos[1]) { // matching path
              targets = [];
              for (var y = 1; y < path.length; y++) { // collect all non-zero targets
                target_dist = path[y] - o.pos[1];
                if (target_dist != 0) { targets.push(target_dist); }
              }
              o.target[1] = targets[Math.floor(Math.random() * targets.length)];
              break;
            }
          }
        }
        o.horizontal = true;
      }
    }

    // calculate min delta needed for move reach
    delta_x = Math.min(delta, Math.abs(o.target[0]) / this.VELOCITY);
    delta_y = Math.min(delta, Math.abs(o.target[1]) / this.VELOCITY);

    // calculate position update for delta
    delta_x = Math.round(Math.sign(o.target[0]) * this.VELOCITY * delta_x * 100) / 100;
    delta_y = Math.round(Math.sign(o.target[1]) * this.VELOCITY * delta_y * 100) / 100;

    // apply move
    o.pos[0] = Math.round((o.pos[0] + delta_x) * 100) / 100;
    o.pos[1] = Math.round((o.pos[1] + delta_y) * 100) / 100;
    o.target[0] = Math.round((o.target[0] - delta_x) * 100) / 100;
    o.target[1] = Math.round((o.target[1] - delta_y) * 100) / 100;

    // update sprite settings
    if (delta_y != 0) { o.sprite_flop = -1; } // on ladder, hands up!
    else { o.sprite_flop = 1; }
  }
}

/**
 * @param position
 * @return enemy at position
 */
Enemys.prototype.checkCollision = function (pPos) {
  for (var i = 0; i < this.enemyData.length; i++) {
    o = this.enemyData[i];
    // relaxed collision detection, enemy and player size of 1x1, relaxation by 0.2
    if (pPos[0] < o.pos[0] + 0.8 && o.pos[0] < pPos[0] + 0.8 && pPos[1] < o.pos[1] + 0.8 && o.pos[1] < pPos[1] + 0.8) {
      return true;
    }
  }
  return false;
}

Enemys.prototype.draw = function (ctx, width, height, assets) {
  var o;
  for (var i = 0; i < this.enemyData.length; i++) {
    o = this.enemyData[i];
    ctx.save();
    ctx.scale(1, o.sprite_flop);
    y = o.sprite_flop < 0 ? (o.pos[1] + 1) * height * o.sprite_flop : o.pos[1] * height * o.sprite_flop;
    ctx.drawImage(assets[o.id][0], o.pos[0] * width, y, width, height);
    ctx.restore();
  }
}