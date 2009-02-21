var points = [];
var mx = 800;
var my = 600;

/* calculate distance between (x1, y1) and (x2, y2) */
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

function distP(p, q) {
  return distance(p.x, p.y, q.x, q.y);
}
var vzero = {x:0, y:0};
function distP0(p) {
  return distP (p,vzero);
}

var context = $('#canvas')[0].getContext('2d');

$('#canvas').width(mx).height(my);

function cumLen (ps) {
  var l = 0;
  for (var i=1; i < ps.length; i++) {
    l += distance(ps[i-1].x, ps[i-1].y, ps[i].x, ps[i].y);
  }
  return l;
};
function drawDot(x, y) {
  context.fillStyle = "rgb(0,0,0)";
  context.beginPath();
  context.arc(x, y, 2, 0, Math.PI*2, true);
  context.fill();
};

function drawLine (p, q) {
  context.beginPath();
  context.lineWidth = 1;
  context.strokeStyle = "rgb(0,0,0)";
  context.moveTo (p.x, p.y);
  context.lineTo (q.x, q.y);
  context.stroke();
};
function delLine (p, q) {
  context.beginPath();
  context.lineWidth = 2;
  context.strokeStyle = "rgb(255,255,255)";
  context.moveTo (p.x, p.y);
  context.lineTo (q.x, q.y);
  context.stroke();
};


function drawBall(p) {
  return drawDot (p.x, p.y);
}

function delDot(x, y) {
  context.fillStyle = "rgb(255,255,255)";
  context.beginPath();
  context.arc(x, y, 3, 0, Math.PI*2, true);
  context.fill();
}
function delBall(p) {
  return delDot(p.x, p.y);
};

var minD = 2;

var ball = {c:{x:  15.0, y:   200},
	    o:{x: 10.0, y:  203}};
var g = 150.0; // pixel / s^2

var d = 1000.0/30;

var jump = {x:0, y:-100};



var maxL = 200;

var bouncies = [0.7, 1.1];
var ibounce = 0;
var bouncy = bouncies[ibounce];

$('#bounce').text(bouncy.toString());

$('#canvas').keydown(function(e) {
  ibounce = (ibounce + 1) % bouncies.length;
  bouncy = bouncies[ibounce];
  $('#bounce').text(bouncy.toString());
});

$('#canvas').mousemove(function(e) {
  /* e will give us absolute x, y so we need to calculate relative to canvas position */
  var pos = $('#canvas').position();
  var ox = e.pageX - pos.left;
  var oy = e.pageY - pos.top;
  var p = {x:ox, y:oy};

  if ((points.length <= 0) || (distP(points[points.length-1], p) >= minD)) {
    points.push(p);
  }
  if (points.length >= 2) {
    drawLine (points[points.length-2], points[points.length-1]);
  }

  while ((points.length >= 2) && (cumLen(points) > maxL)) {
    var q0 = points[0]; var q1 = points[1];
    delLine(q0, q1);
    points = points.slice(1);
  }

  return false;
});

$('#clear-button').click(function() {
  points = [];
  context.clearRect(0, 0, 600, 400);
});



function update() {
  var nx = ball.c.x + (ball.c.x - ball.o.x);
  var ac = g * (d/1000.0)*(d/1000.0);
  var vy = (ball.c.y - ball.o.y);
  var ny = ball.c.y + vy + ac;

  $("#debug").text(nx.toString()+":"+ny.toString());
  var nball = {o : {x : ball.c.x, y : ball.c.y},
	       c : {x : Math.max(0.0, Math.min(mx, nx)),
	            y : Math.max(0.0, Math.min(my, ny))}};
  ball = collHandle (points, nball);

  delBall (ball.o);
  drawBall (ball.c);

};

function addP (p,q) {
  return { x: p.x + q.x, y: p.y+q.y };
};
function negP (p) {
  return smulP(-1, p);
};
function subP (p, q) {
  return addP(p, negP(q));
};
function mulPP (p, q) {
  return  p.x*q.x + p.y*q.y;
}
function smulP(a, p) {
  return { x: a*p.x, y: a*p.y };
}

function collHandle (ps, ball) {
  if (ps.length < 2) {
    return ball;
  } else {
    var r = collides (ps, ball);
    if (r == false) {
      return ball;
    } else {
      var o = ball.o;
      var c = ball.c;
      return project (r.p, r.q, ball.c, ball.o, r.cut);
    }
  }
};

// <a,b> = |a| * |b| * cos (a,b)
// a \ b = b / |b| * <a,b>



function project(p, q, c, o, cut) {
//  return {o: subP(cut, subP(o,  c)), c : cut};
  var oball = {c:c, o:o};
  var v = subP(c,o);
  if (distP0(v) <= epsilon) {
    return oball;
  }
  var uv = smulP (1.0/distP0(v), v);
  var pq = subP(p,q);
  if (distP0(pq) <= epsilon) {
    return oball;
  }
  var uPQ = smulP (1.0/distP0(pq),pq);
  var inPQ = smulP (mulPP(v, uPQ),
		    uPQ);
  var normalPQ = subP(v, inPQ);
  var nv = subP(inPQ, smulP(bouncy, normalPQ));

  $("#debug2").text(addP(normalPQ, inPQ)+":"+v);

//  if (distP0(nv) <= epsilon) {
//    return oball;
//  }
//  var unv = smulP (1.0/distP0(nv), nv);
//  return {c:addP(cut,smulP(0.5,nv)), o:subP(cut, smulP(0.5,nv))};

  return {c:addP(o,nv), o:o};

//  var travSoFar = distP(cut, o);

//  var travLeft = distP0(v)-travSoFar;

//  var nc = addP(cut, smulP(travLeft, unv));
//  var no = subP(nc, no);
//  return {o:no, c:nc};

// return {o: subP(cut, subP(o,  c)), c : cut};
};

// precondition: ps.length >=2;
function collides (ps, ball) {
  for (var i = 1; i<ps.length; i++) {
    var cut = intersect (ps[i-1],ps[i], ball.c, ball.o);
    if (cut != false) {
      return {cut:cut, p:ps[i-1], q:ps[i]};
    }
  }
  return false;
};

var epsilon = 0;
var eps2 = 0.01;

function intersect (a1, a2, b1, b2) {
  if ((distP(a1, a2) <= epsilon)
    || (distP(b1, b2)<= epsilon))
  {
    $("#debug1").text("identical");
    return false;
  } else {
    var x1 = a1.x; var x2 = a2.x; var x3 = b1.x; var x4 = b2.x;
    var y1 = a1.y; var y2 = a2.y; var y3 = b1.y; var y4 = b2.y;

    var nomA = (x4 - x3)*(y1 - y3) - (y4 - y3)*(x1-x3);
    var nomB = (x2 - x1)*(y1 - y3) - (y2 - y1)*(x1-x3);
    var den = (y4 - y3)*(x2 - x1) - (x4 - x3)*(y2-y1);
    if (Math.abs(den) <= epsilon) {
      $("#debug1").text("den to small");
      return false;
    } else {
      var ua = nomA / den;
      var ub = nomB / den;
      if ((-eps2<=ua) && (ua<=1+eps2) &&
	  (+eps2<=ub) && (ub<=1+eps2)) {
	return {x : x1 + ua * (x2 - x1),
		y : y1 + ua * (y2 - y1)};
      } else {
	$("#debug1").text("outside");
	return false;
      }
    }
  }
};


$('#canvas').click(function(e) {
  ball.o = subP(ball.o, smulP(d/1000.0, jump));
});

$(document).everyTime(d, update);

$('.debug').hide();

// $(document).everyTime("0.05s", update);

