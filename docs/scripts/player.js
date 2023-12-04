var Player = function Player(actionCallback) {
  this.VELOCITY = [0.01, 0.02]; // distance per delta, normal and falling speed

  this.score = 0;
  this.lifes = 3;
  this.falling = false;
  this.deathFall = false; // only used for death sound
  this.actionCallback = actionCallback;
}

/**
 * Sets player, world and enemys information
 */
Player.prototype.setProperties = function (playerData, world, enemys) {
  this.playerData = playerData;
  this.playerData.sprite_flip = 1;
  this.position = [playerData.pos[0], playerData.pos[1]];
  this.move = [0, 0];
  this.move_next = [0, 0, false]; // movement horizonatlly <xor> vertically, bool to check latest input, makes player control smoother

  this.world = world;
  this.enemys = enemys;
}

Player.prototype.update = function (delta, assets_sounds) {
  if (this.move[0] == 0 && this.move[1] == 0) {
    this.move = this.move_next.slice(); // copy
    this.falling = false; // reset to default

    surrounding = this.world.getSurrounding(this.position);

    // if standing on vanishable block, trigger
    if (surrounding[1][2] == 2) { this.actionCallback("vanish", this.position.slice(0)); }

    // collect star
    if (surrounding[1][1] == 4 || surrounding[1][1] == 5) {
      this.actionCallback("collect", [surrounding[1][1], this.position.slice(0)]);
      assets_sounds[surrounding[1][1]][0].play();
    }

    // check for movement validity and correct move if necessary
    if (surrounding[1][2] != 1 && surrounding[1][2] != 2 && surrounding[1][2] != 3) { this.move = [0, 1]; this.falling = true; } // fall down
    if ((surrounding[1][2] == 1 || surrounding[1][2] == 2) && this.move[1] > 0) { this.move[1] = 0; } // standing on block
    if (surrounding[1][1] != 3 && this.move[1] < 0) { this.move[1] = 0 } // cant move up without ladder
    if ((surrounding[0][1] == 1 || surrounding[0][1] == 2) && this.move[0] < 0) { this.move[0] = 0; } // block on the left
    if ((surrounding[2][1] == 1 || surrounding[2][1] == 2) && this.move[0] > 0) { this.move[0] = 0; } // block on the right

    // all illegal movements where sorted out, prioritize remaining movement
    if (this.move[2] && this.move[1] != 0) { this.move[0] = 0; }
    else if (this.move[0] != 0) { this.move[1] = 0; }

    if ((this.move[0] != 0 || this.move[1] != 0) && !this.falling) {
      assets_sounds.p[0].playbackRate = 1.7; // if too fast won't be played well
      assets_sounds.p[0].play();
    }
  }
  // calculate min delta needed for move reach
  delta_x = Math.min(delta, Math.abs(this.move[0]) / this.VELOCITY[0]);
  delta_y = Math.min(delta, Math.abs(this.move[1]) / this.VELOCITY[this.falling ? 1 : 0]);

  // calculate position update for delta
  delta_x = Math.round(Math.sign(this.move[0]) * this.VELOCITY[0] * delta_x * 100) / 100;
  delta_y = Math.round(Math.sign(this.move[1]) * this.VELOCITY[this.falling ? 1 : 0] * delta_y * 100) / 100;

  // apply move
  this.position[0] = Math.round((this.position[0] + delta_x) * 100) / 100;
  this.position[1] = Math.round((this.position[1] + delta_y) * 100) / 100;
  this.move[0] = Math.round((this.move[0] - delta_x) * 100) / 100;
  this.move[1] = Math.round((this.move[1] - delta_y) * 100) / 100;

  // check for collision with enemys, fall behind gui
  if (this.enemys.checkCollision(this.position)) {
    this.move = [0, 25];
    this.falling = true;
    this.deathFall = true;
    assets_sounds.p[1].play();
  }
  // die behind gui
  if (this.position[1] > 20) {
    if (!this.deathFall) { assets_sounds.p[1].play(); }
    this.actionCallback("die", undefined);
  }

  // update sprite settings
  this.playerData.sprite_id = this.falling ? 0 : Math.floor(((this.position[0] % 1.0) + (this.position[1] % 1.0)) * 3); // leg movement only when not falling
  if (delta_x < 0) { this.playerData.sprite_flip = -1; } // look left
  else if (delta_x > 0) { this.playerData.sprite_flip = 1; } // look right
}

// draw the player onto the canvas
Player.prototype.draw = function (ctx, width, height, assets) {
  ctx.save();
  ctx.scale(this.playerData.sprite_flip, 1);
  x = this.playerData.sprite_flip < 0 ? (this.position[0] + 1) * width * this.playerData.sprite_flip : this.position[0] * width * this.playerData.sprite_flip;
  ctx.drawImage(assets.p[this.playerData.sprite_id], x, height * this.position[1], width, height);
  ctx.restore();
}

// players up action
Player.prototype.up = function (isPress) {
  if (isPress) {
    this.move_next[1] = -1;
    this.move_next[2] = true;
  }
  else if (this.move_next[1] == -1) { this.move_next[1] = 0; }
}

// players left action
Player.prototype.left = function (isPress) {
  if (isPress) {
    this.move_next[0] = -1;
    this.move_next[2] = false;
  }
  else if (this.move_next[0] == -1) { this.move_next[0] = 0; }
}

// players down action
Player.prototype.down = function (isPress) {
  if (isPress) {
    this.move_next[1] = 1;
    this.move_next[2] = true;
  }
  else if (this.move_next[1] == 1) { this.move_next[1] = 0; }
}

// players right action
Player.prototype.right = function (isPress) {
  if (isPress) {
    this.move_next[0] = 1;
    this.move_next[2] = false;
  }
  else if (this.move_next[0] == 1) { this.move_next[0] = 0; }
}

// update player score
Player.prototype.updateScore = function (star_id) {
  if (star_id == 4) { additional = 10; }
  else { additional = 20; }
  this.score += additional;
}

// decrement player life count
Player.prototype.decrementLifes = function () {
  this.lifes -= 1;
}

// GETTERS
Player.prototype.getScore = function () { return this.score; };
Player.prototype.getLifes = function () { return this.lifes; };