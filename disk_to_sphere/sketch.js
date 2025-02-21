let sphere_radius = 50;
let lat_segments = 10; // Number of latitude divisions
let lon_segments = 20; // Number of longitude divisions

let airplane_model;
let t = 0.0; // Interpolation parameter

function preload() {
  airplane_model = loadModel('../airplane.obj');
}

function setup() {
  createCanvas(400, 400, WEBGL);

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

  createLoop({ duration: 400.0 / 30.0, gif: true })

}

let rotation_history = [];

function draw() {
  background(255);
  orbitControl();

  ambientLight(10);
  directionalLight(100, 100, 100, -1, 1, 1);

  drawGrid();

  t += TWO_PI / 120;



  if (t < 1) {
    draw2DSpace(0);
  } else if (t < 4) {
    push();
    translate(-(t - 1) * 10, 0, 0)
    draw2DSpace(0);
    pop();
    push()
    translate((t - 1) * 10, 0, 0)
    draw2DSpace(0);
    pop();
  }
  else if (t < 8) {
    push();
    translate(-3 * 10, 0, 0)
    draw2DSpace(0);
    pop();
    push()
    translate(3 * 10, 0, 0);
    rotateX(min(t - 4, PI));
    draw2DSpace(0);
    pop();
  }
  else if (t < 12) {
    push();
    translate(-3 * 10, 0, 0)
    draw2DSpace(1, t - 8);
    pop();
    push()
    translate(3 * 10, 0, 0);
    rotateX(PI);
    draw2DSpace(-1, t - 8);
    pop();
  }
  else if (t < 100) {
    push();
    translate(min(map(t, 12, 15, -3, 0), 0) * 10, 0, 0)
    draw2DSpace(1, PI);
    pop();
    push()
    translate(max(map(t, 12, 15, 3, 0), 0) * 10, 0, 0);
    rotateX(PI);
    draw2DSpace(-1, PI);
    pop();
  }
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