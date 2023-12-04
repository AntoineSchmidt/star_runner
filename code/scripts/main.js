$(function () {
  var canvas = document.getElementById('canvas');

  // Setup canvases
  var maxWidth = document.body.clientWidth;
  var maxHeight = document.body.clientHeight;

  var ASPECT = 30 / (22 + 5); // space for message

  var scaledHeight = maxWidth / ASPECT;
  var scaledWidth = maxHeight * ASPECT;

  var w, h;
  if (scaledWidth < maxWidth) {
    w = Math.floor(scaledWidth);
    h = Math.floor(maxHeight);
  } else {
    w = Math.floor(maxWidth);
    h = Math.floor(scaledHeight);
  }

  // remove message space from canvas height
  h -= 5 * (h / 27);

  canvas.width = w;
  canvas.style.width = w + 'px';

  canvas.height = h;
  canvas.style.height = h + 'px';

  console.log('Initialized canvas size to: ' + w + 'x' + h);

  // set properties for message box to blend in nicely
  var message = document.getElementById('message');
  message.style.fontSize = 0.9 * (h / 22) + 'px';
  message.style.maxWidth = w + 'px';
  message.style.paddingTop = 0.5 * (h / 22) + 'px';
  message.style.paddingBottom = 0.4 * (h / 22) + 'px';

  var ctx = canvas.getContext('2d');

  var lastTick;
  var delta = 0;
  var now;

  var game = new Game(ctx, w / 30, h / 22, function () {
    var loop = function () {
      window.requestAnimFrame(loop);
      now = Date.now();
      if (lastTick) { delta = now - lastTick; }
      lastTick = now;
      game.update(delta);
    };

    window.requestAnimFrame = function () {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (a) { window.setTimeout(a, 1E3 / 60); };
    }();

    loop();
  });
});