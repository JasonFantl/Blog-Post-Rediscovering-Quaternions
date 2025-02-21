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



let rotation_history = [];

function draw() {
  background(255);
  orbitControl();

  lights(); // enable default lighting for proper shading

  ambientLight(100);
  // directionalLight(255, 255, 255, -1, 1, 1);


  let pitch_delta = 50;
  let roll_delta = 10;
  let q1 = eulerToQuaternion(radians(0), radians(90 - pitch_delta), radians(-roll_delta));
  let q2 = eulerToQuaternion(radians(0), radians(90 + pitch_delta), radians(roll_delta));

  if (frameCount > 40) {
    t += 0.005;
    if (t > 1.0) t = 1.0;
  }

  let qInterpolated = slerp(q1, q2, t);
  rotation_history.push(qInterpolated);
  let eulerInterpolated = quaternionToEuler(qInterpolated);

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

  // draw the reference sphere inside
  let sphere_radius = 80;
  noFill();
  stroke(0);
  strokeWeight(0.5);
  for (let i = 0; i < 3; i++) {
    push();
    let axis = [0, 0, 0];
    axis[i] = 1;
    rotate(HALF_PI, axis);

    beginShape();
    for (let a = 0; a < TWO_PI; a += 0.01) {
      let x = sphere_radius * cos(a); // Circle radius
      let y = sphere_radius * sin(a); // Circle radius
      vertex(x, y, 0); // Draw the circle in the XY plane
    }
    endShape(CLOSE);
    pop();
  }

  // draw the rotation history
  // Draw a continuous line connecting the rotated positions.
  stroke(214, 152, 14);
  strokeWeight(3);
  let previous = null;

  for (const rotation of rotation_history) {
    // Base point to be rotated
    let base = createVector(0, 0, sphere_radius);
    // Compute rotated position explicitly
    let rotatedPos = rotateVectorByQuaternion(base, rotation);

    if (previous !== null) {
      line(previous.x, previous.y, previous.z, rotatedPos.x, rotatedPos.y, rotatedPos.z);
    }
    previous = rotatedPos;
  }
}

function keyPressed() {
  console.log(`Camera position:`, this._renderer._curCamera.eyeX, this._renderer._curCamera.eyeY, this._renderer._curCamera.eyeZ);
}