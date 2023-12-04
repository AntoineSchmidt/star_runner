var Keyboard = function Keyboard(eventCallback) {
  this.eventCallback = eventCallback;
  this.controls = {
    up: [87, 38], // W, UP
    left: [65, 37], // A
    down: [83, 40], // S
    right: [68, 39], // D
  };
  this.controlsLookup = {};
  this.pressed = {};

  this.setControlMappings();
  this.addListeners();
  console.log('Controls set to ', this.controlsLookup);
}

Keyboard.prototype.setControlMappings = function () {
  for (var command in this.controls) {
    for (var i = 0; i < this.controls[command].length; i++) {
      console.log(this.controls[command][i]);
      this.controlsLookup[this.controls[command][i].toString()] = command;
    }
  }
}

Keyboard.prototype.getAction = function (key) {
  return this.controlsLookup[key];
}

Keyboard.prototype.addListeners = function () {
  var that = this;
  $('body').on('keydown', function (e) {
    var action = that.getAction(e.which);
    if (action && !that.pressed[action]) {
      that.eventCallback(action, true);
      that.pressed[action] = 1;
    }
  }).on('keyup', function (e) {
    var action = that.getAction(e.which);
    if (action) {
      that.eventCallback(action, false);
      that.pressed[action] = 0;
    }
  });
}