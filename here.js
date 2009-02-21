var points = [];
var mx = 600.0;
var my = 400.0;

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
    l += distance(ps[i-1].x, ps[i-1].y, ps[i].x, ps[i].y);
  }
  return l;
};
function drawDot(x, y) {
  context.fillStyle = "rgb(0,0,0)";
  context.beginPath();
  context.arc(x, y, 2, 0, Math.PI*2, true);
  context.fill();
}

function drawP(p) {
  return drawDot (p.x, p.y);
}

function delDot(x, y) {
  context.fillStyle = "rgb(255,255,255)";
  context.beginPath();
  context.arc(x, y, 2, 0, Math.PI*2, true);
  context.fill();
}
function delP(p) {
  return delDot(p.x, p.y);
};


$('#canvas').mousemove(function(e) {
  /* e will give us absolute x, y so we need to calculate relative to canvas position */
  var pos = $('#canvas').position();
  var ox = e.pageX - pos.left;
  var oy = e.pageY - pos.top;
  var p = {x:ox, y:oy};
  drawP(p);
  points.push(p);

    while (cumLen(points) > 200) {
      var q = points[0];
      delP(q);
      points = points.slice(1);
    }

  return false;
});

$('#clear-button').click(function() {
  points = [];
  context.clearRect(0, 0, 600, 400);
});

var ball = {c:{x:  11.0, y:   200},
	    o:{x: 10.0, y:  202}};
var g = 40.0; // pixel / s^2

var d = 30;

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

  delP (ball.o);
  drawP (ball.c);

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
  var inPQ = smulP (mulPP(v, pq),
		    uPQ);
  var normalPQ = subP(v, inPQ);
  var nv = subP(inPQ, normalPQ);
  if (distP0(nv) <= epsilon) {
    return oball;
  }
  var unv = smulP (1.0/distP0(nv), nv);

  return {c:addP(cut,smulP(0.5,nv)), o:subP(cut, smulP(0.5,nv))};

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
	  (+eps2<=ub) && (ub<=1-eps2)) {
	return {x : x1 + ua * (x2 - x1),
		y : y1 + ua * (y2 - y1)};
      } else {
	$("#debug1").text("outside");
	return false;
      }
    }
  }
};

var p1 = {x:10, y:15}; var p2 = {x:200, y:23};
var p3 = {x:25, y:210}; var p4 = {x:215, y:190};

drawP(p1); drawP(p2); drawP(p3); drawP(p4);

var q = intersect (p4, p1, p2, p3);

if (q != false) {
  drawP(q);
}

update();
$(document).everyTime(d, update);


// $(document).everyTime("0.05s", update);

