// ADD TO TOP OF SCRIPT
const TETRA_AXES = [
  new p5.Vector(1, 1, 1).normalize(),
  new p5.Vector(-1, -1, 1).normalize(),
  new p5.Vector(-1, 1, -1).normalize(),
  new p5.Vector(1, -1, -1).normalize()
];

let airplane_model;
let t = 0.0; // Time parameter for quaternion interpolation

function preload() {
  airplane_model = loadModel('../airplane.obj');
}

function setup() {
  createCanvas(500, 500, WEBGL);
  frameRate(30);

  // Initial camera position
  let camX = 658.4792203759771;
  let camY = -144.99113587242542;
  let camZ = -121.52988621648866;
  let targetX = 0, targetY = 0, targetZ = 0;
  let upX = 0, upY = 1, upZ = 0;

  camera(camX, camY, camZ, targetX, targetY, targetZ, upX, upY, upZ);

  // createLoop({ duration: 280.0 / 30.0, gif: true });
}

// REPLACE quaternionToEuler WITH TETRAHEDRAL PROJECTION
function quaternionToTetrahedralAngles(q) {
  const angle = 2 * Math.acos(q.w);
  const axis = new p5.Vector(q.x, q.y, q.z).normalize();

  return {
    alpha: angle * axis.dot(TETRA_AXES[0]),
    beta: angle * axis.dot(TETRA_AXES[1]),
    gamma: angle * axis.dot(TETRA_AXES[2]),
    delta: angle * axis.dot(TETRA_AXES[3])
  };
}

// MODIFIED DRAW FUNCTION WITH 4-RING GIMBAL
function draw() {
  background(255);
  orbitControl();
  lights();
  ambientLight(100);
  drawGrid();
  t += 0.05;

  const q = pseudoRandomQuaternion(t);
  const angles = quaternionToTetrahedralAngles(q);

  push();

  // Fourth ring (delta) - outermost
  rotate(angles.delta, TETRA_AXES[3].array());
  drawRing(160, 4, color(150, 150, 255), 'tetra4');

  // Third ring (gamma)
  push();
  rotate(angles.gamma, TETRA_AXES[2].array());
  drawRing(145, 4, color(255, 100, 100), 'tetra3');

  // Second ring (beta)
  push();
  rotate(angles.beta, TETRA_AXES[1].array());
  drawRing(130, 4, color(200, 10, 10), 'tetra2');

  // First ring (alpha) - innermost
  push();
  rotate(angles.alpha, TETRA_AXES[0].array());
  drawRing(115, 4, color(10, 200, 10), 'tetra1');

  // Airplane model
  push();
  scale(400);
  fill(255);
  stroke(0);
  strokeWeight(1);
  rotateX(PI);
  model(airplane_model);
  pop();

  pop(); // alpha
  pop(); // beta
  pop(); // gamma
  pop(); // delta

  // Reference airplane
  push();
  translate(0, 100, 0);
  applyQuaternion(q);
  scale(400);
  fill(255);
  stroke(0);
  strokeWeight(1);
  rotateX(PI);
  model(airplane_model);
  pop();

  drawReferenceLines();
}


// **Reference Lines**
function drawReferenceLines() {
  noStroke();
  fill(100, 100, 100);
  push();
  translate(0, 0, 330);
  rotateX(HALF_PI);
  cylinder(2, 400);
  pop();
  push();
  translate(0, 0, -330);
  rotateX(HALF_PI);
  cylinder(2, 400);
  pop();
}

