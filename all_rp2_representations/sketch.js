let sphere_radius = 50;
let lat_segments = 10; // Number of latitude divisions
let lon_segments = 20; // Number of longitude divisions

let airplane_model;
let t = 0.0; // Interpolation parameter

function preload() {
  airplane_model = loadModel('../airplane.obj');
}

function setup() {
  createCanvas(600, 400, WEBGL);

  ambientLight(10);
  directionalLight(100, 100, 100, -1, 1, 1);

  frameRate(30);

  // Slower orbital camera control
  orbitControl();


  let camX = 599.7011734000794 / 1.5;
  let camY = -241.5875220647641 / 1.5;
  let camZ = -226.6733292593074 / 1.5;
  let targetX = 0, targetY = 0, targetZ = 0; // Look at center
  let upX = 0, upY = 1, upZ = 0; // Up vector

  camera(camX, camY, camZ, targetX, targetY, targetZ, upX, upY, upZ);

  createLoop({ duration: 240.0 / 30.0, gif: true })

}

let rotation_history = [];

function draw() {
  background(255);
  orbitControl();

  ambientLight(10);
  directionalLight(100, 100, 100, -1, 1, 1);

  drawGrid();

  t += PI / 240;

  let quaternion = pseudoRepeatingRandomQuaternion(t);

  // let angle = t % TWO_PI; // continuously increasing rotation angle
  // let quaternion = axisAngleToQuaternion({ x: 0, y: 0, z: 1 }, angle);

  // drawGrid();

  translate(0, 0, 120);

  // draw airplane
  push();
  applyQuaternion(quaternion);
  scale(200);
  fill(215, 216, 192);
  stroke(0);
  strokeWeight(1);
  emissiveMaterial(220, 220, 220);
  rotateX(PI);
  rotateY(-HALF_PI);
  model(airplane_model);
  pop();

  // draw the reference sphere inside
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

  translate(0, 0, -110);

  // draw lines in 2D plane
  stroke(0);
  strokeWeight(0.5);
  line(-1, -sphere_radius, 0, -1, sphere_radius, 0);
  line(-1, 0, -sphere_radius, -1, 0, sphere_radius);

  // draw the rotation vector in 2D
  drawRodriguesVector(quaternion, vector_length = sphere_radius);

  // 2d circle
  fill(100, 100, 100, 50);
  strokeWeight(2);
  push();
  colorMode(HSB, 360, 100, 100);

  let axis = [0, 1, 0];
  rotate(HALF_PI, axis);

  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.01) {
    let x = sphere_radius * cos(a);
    let y = sphere_radius * sin(a);

    let hueValue = map(a, 0, TWO_PI, 0, 720) % 360; // Map angle to HSB color spectrum
    stroke(hueValue, 100, 100); // Set rainbow color
    vertex(x, y, 0);
  }
  endShape(CLOSE);
  pop();


  translate(0, 0, -110);

  drawRodriguesVector3D(quaternion);

  // 3D sphere
  push();
  draw2DSpace(1, PI);
  rotateX(PI);
  draw2DSpace(-1, PI);
  pop();

}

function draw2DSpace(dir, t) {
  // sphere
  push();
  let axis = [0, 1, 0];
  rotate(HALF_PI, axis);

  // sphere edge
  noFill(0);
  strokeWeight(2);

  colorMode(HSB, 360, 100, 100);

  beginShape();
  for (let a = 0; a < TWO_PI; a += 0.01) {
    let x = sphere_radius * cos(a);
    let y = sphere_radius * sin(a);

    let hueValue = map(a, 0, TWO_PI, 0, 720) % 360; // Map angle to HSB color spectrum
    stroke(hueValue, 100, 100); // Set rainbow color
    vertex(x, y, 0);
  }
  endShape(CLOSE);

  pop();

  push();
  rotate(HALF_PI, axis);

  drawGreatCircles(dir, min(t, PI));

  fill(100, 100, 100, 50);
  strokeWeight(0);
  drawSphere(dir, min(t, PI));
  pop();
}

function drawSphere(dir, t) {
  for (let lat = 0; lat < lat_segments; lat++) {
    let theta1 = map(lat, 0, lat_segments, 0, HALF_PI);
    let theta2 = map(lat + 1, 0, lat_segments, 0, HALF_PI);

    for (let lon = 0; lon < lon_segments; lon++) {
      let phi1 = map(lon, 0, lon_segments, 0, TWO_PI);
      let phi2 = map(lon + 1, 0, lon_segments, 0, TWO_PI);

      let p1 = spherePoint(theta1, phi1, t, dir);
      let p2 = spherePoint(theta1, phi2, t, dir);
      let p3 = spherePoint(theta2, phi1, t, dir);
      let p4 = spherePoint(theta2, phi2, t, dir);

      beginShape();
      vertex(p1.x, p1.y, p1.z);
      vertex(p2.x, p2.y, p2.z);
      vertex(p4.x, p4.y, p4.z);
      endShape(CLOSE);

      beginShape();
      vertex(p1.x, p1.y, p1.z);
      vertex(p4.x, p4.y, p4.z);
      vertex(p3.x, p3.y, p3.z);
      endShape(CLOSE);
    }
  }
}

function spherePoint(theta, phi, t, dir) {
  let x = sphere_radius * sin(theta) * cos(phi);
  let y = sphere_radius * sin(theta) * sin(phi);
  let z = sphere_radius * cos(theta) * dir * (cos(t) - 1) / 2;
  return createVector(x, y, z);
}

function drawGreatCircles(dir, t) {
  strokeWeight(0.5);
  stroke(0);
  noFill();

  // Line in the X-Z plane
  beginShape();
  for (let theta = -HALF_PI; theta <= HALF_PI; theta += 0.02) {
    let x = sphere_radius * sin(theta);
    let z = sphere_radius * cos(theta) * dir * (cos(t) - 1) / 2; // Adjust based on animation
    vertex(x, 0, z);
  }
  endShape();

  // Line in the Y-Z plane
  beginShape();
  for (let theta = -HALF_PI; theta <= HALF_PI; theta += 0.02) {
    let y = sphere_radius * sin(theta);
    let z = sphere_radius * cos(theta) * dir * (cos(t) - 1) / 2; // Adjust based on animation
    vertex(0, y, z);
  }
  endShape();
}


function drawRodriguesVector3D(quaternion, vector_length = 1, shaftRadius = 1.5, ballRadius = 5, arrowColor = [250, 100, 100]) {
  push();
  noStroke();
  fill(arrowColor);
  emissiveMaterial(100, 50, 50);
  specularMaterial(10, 10, 10);

  // 8. Draw the arrow tip (ball) at the end of the arrow vector.
  push();
  translate(quaternion.w * sphere_radius, quaternion.y * sphere_radius, quaternion.z * sphere_radius);
  sphere(ballRadius);
  pop();

  push();
  translate(-quaternion.w * sphere_radius, -quaternion.y * sphere_radius, -quaternion.z * sphere_radius);
  sphere(ballRadius);
  pop();

  pop();
}

function pseudoRepeatingRandomQuaternion(t) {
  // Use trigonometric functions with phase shifts for smooth randomness
  let w = cos(-t * 3 + 1);
  let x = 0;
  let y = cos(t * 1 + 1);
  let z = sin(t * 3 + 2);

  // Normalize to ensure a valid rotation quaternion
  let mag = sqrt(w * w + x * x + y * y + z * z);
  return { w: w / mag, x: x / mag, y: y / mag, z: z / mag };
}