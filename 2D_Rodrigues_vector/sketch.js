let airplane_model;
let t = 0.0; // Interpolation parameter
let sphere_radius = 80;

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

  createLoop({ duration: 240.0 / 30.0, gif: true })

}

let rotation_history = [];

function draw() {
  background(255);
  orbitControl();

  ambientLight(10);
  directionalLight(100, 100, 100, -1, 1, 1);

  drawGrid();

  t += TWO_PI / 120;

  let quaternion = pseudoRandom2DQuaternion(t + 1);

  let angle = t % TWO_PI; // continuously increasing rotation angle
  // let quaternion = axisAngleToQuaternion({ x: 0, y: 0, z: 1 }, angle);

  // drawGrid();

  // draw airplane
  push();
  applyQuaternion(quaternion);
  scale(400);
  fill(215, 216, 192);
  stroke(0);
  strokeWeight(1);
  emissiveMaterial(220, 220, 220);
  rotateX(PI);
  rotateY(-HALF_PI);
  model(airplane_model);
  pop();

  // draw lines in 2D plane
  stroke(0);
  strokeWeight(0.5);
  line(-1, -sphere_radius, 0, -1, sphere_radius, 0);
  line(-1, 0, -sphere_radius, -1, 0, sphere_radius);

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

  // draw the rotation vector
  drawRodriguesVector(quaternion, vector_length = sphere_radius);


  // Set color mode to HSB for easy rainbow colors

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




  // // draw the rotation history
  // stroke(197, 21, 241);
  // strokeWeight(4);
  // for (const rotation of rotation_history) {
  //   push();
  //   applyQuaternion(rotation);
  //   point(0, 0, sphere_radius);
  //   pop();
  // }

}


function keyPressed() {
  recording_frame_count = frameCount;



  console.log(`Camera position:`, this._renderer._curCamera.eyeX, this._renderer._curCamera.eyeY, this._renderer._curCamera.eyeZ);

}