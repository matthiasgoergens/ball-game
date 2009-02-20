var points = [];
var mx = 600.0;
var my = 400.0;

/* calculate distance between (x1, y1) and (x2, y2) */
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

/* are there any points close to (x, y) ? */
function anyClose(x, y) {
  var result = false;
  $.each(points, function() {
           if (distance(x, y, this[0], this[1]) < 20) {
             result = true;
               return false; // break out of each
           }
	   return true;
         });
  return result;
}

var context = $('#canvas')[0].getContext('2d');

function cumLen (ps) {
  var l = 0;
  for (var i=1; i < ps.length; i++) {
    l += distance(ps[i-1][0], ps[i-1][1], ps[i][0], ps[i][1]);
  }
  return l;
};
function drawDot(x, y) {
  context.fillStyle = "rgb(0,0,0)";
  context.beginPath();
  context.arc(x, y, 2, 0, Math.PI*2, true);
  context.fill();
}

function delDot(x, y) {

  context.fillStyle = "rgb(255,255,255)";
  context.beginPath();
  context.arc(x, y, 2, 0, Math.PI*2, true);
  context.fill();
}

$('#canvas').mousemove(function(e) {
  /* e will give us absolute x, y so we need to calculate relative to canvas position */
  var pos = $('#canvas').position();
  var ox = e.pageX - pos.left;
  var oy = e.pageY - pos.top;

  drawDot(ox, oy);
  points.push([ox, oy]);

    while (cumLen(points) > 200) {
      var x = points[0][0];
      var y = points[0][1];
      delDot(x,y);
      points = points.slice(1);
    }

  return false;
});

$('#clear-button').click(function() {
  points = [];
  context.clearRect(0, 0, 600, 400);
});

var ball = {"x":  11.0, "y":   200,
	    "ox": 10.0, "oy":  202};
var g = 20.0; // pixel / s^2

var d = 30;

function update() {
  delDot(ball.x,ball.y);
  var nx = ball.x + (ball.x - ball.ox);
  var ac = g * (d/1000.0)*(d/1000.0);
  var vy = (ball.y - ball.oy)
  var ny = ball.y + vy + ac;

  $("#debug").text(nx.toString()+":"+ny.toString());
  ball.ox = ball.x;
  ball.oy = ball.y;
  ball.x = Math.max(0.0, Math.min(mx, nx));
  ball.y = Math.max(0.0, Math.min(my, ny));
  drawDot (ball.x, ball.y);
};



update();
$(document).everyTime(d, update);


// $(document).everyTime("0.05s", update);

