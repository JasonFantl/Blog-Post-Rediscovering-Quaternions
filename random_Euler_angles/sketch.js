let airplane_model;
let t = 0.0; // Interpolation parameter

function preload() {
  airplane_model = loadModel('../airplane.obj');
}

function setup() {
  createCanvas(500, 500, WEBGL);
  frameRate(30);


  // initial camera position
  let camX = 658.4792203759771;
  let camY = -144.99113587242542;
  let camZ = -121.52988621648866;
  let targetX = 0, targetY = 0, targetZ = 0; // Look at center
  let upX = 0, upY = 1, upZ = 0; // Up vector

  camera(camX, camY, camZ, targetX, targetY, targetZ, upX, upY, upZ);

  createLoop({ duration: 280.0 / 30.0, gif: true })

}



function draw() {
  background(255);
  orbitControl();

  lights(); // enable default lighting for proper shading

  ambientLight(100);

  t += 0.05;

  let quaternion = pseudoRandomQuaternion(t);
  // let quaternion = eulerToQuaternion(radians(0), radians(90), radians(0));
  let eulerInterpolated = quaternionToEuler(quaternion);


  drawGrid();

  // Draw gimbal system correctly
  push();

  // Outermost ring (Yaw, rotates around Z)
  rotate(eulerInterpolated.yaw, [0, 0, 1]);

  push();
  rotate(HALF_PI, [0, 1, 0]);
  drawRing(130, 3, color(200, 10, 10), 'z');
  pop();

  push();
  // Middle ring (Pitch, rotates around Y, but constrained by yaw)
  rotate(eulerInterpolated.pitch, [0, 1, 0]);
  drawRing(115, 3, color(10, 200, 10), 'y');

  push();
  // Innermost ring (Roll, rotates around X, but constrained by pitch)
  rotate(eulerInterpolated.roll, [1, 0, 0]);
  drawRing(100, 3, color(10, 10, 200), 'x');

  // Draw the airplane inside the innermost ring
  scale(400);
  fill(255);
  stroke(0);
  strokeWeight(1);
  // emissiveMaterial(220, 220, 220);
  rotateX(PI);
  model(airplane_model);

  pop(); // End roll ring
  pop(); // End pitch ring
  pop(); // End yaw ring

  // Draw line into gimbal for reference
  noStroke();
  fill(100, 100, 100);
  push();
  translate(0, 0, 330);
  rotateX(HALF_PI);
  cylinder(2, 400)
  pop();
  push();
  translate(0, 0, -330);
  rotateX(HALF_PI);
  cylinder(2, 400)
  pop();
}
