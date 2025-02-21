let t = 0.0; // Interpolation parameter
let alpha = 3.1415 / 10; // Threshold for detecting singularities
let singularities = []; // Store singularities for visualization
let cube_res = 0;

let sphere_radius = 80;

let redundant_slider;

let sliderX, sliderY, sliderZ;

let airplane_model;


function preload() {
  loadJSON("singularities.json", (data) => {
    cube_res = data.cube_res / 2;
    singularities = data.points;
  });

  airplane_model = loadModel('../airplane.obj');

}

function setup() {
  createCanvas(400, 400, WEBGL);
  frameRate(30);
  orbitControl();

  redundant_slider = createSlider(0, 359, 0, 1);
  redundant_slider.position(10, height + 10); // Position below canvas

  sliderX = createSlider(-PI, PI, 0, PI / 100);
  sliderX.position(10, height + 30); // Position below canvas
  sliderY = createSlider(-PI, PI, 0, PI / 100);
  sliderY.position(10, height + 40); // Position below canvas
  sliderZ = createSlider(-PI, PI, 0, PI / 100);
  sliderZ.position(10, height + 50); // Position below canvas

  let camX = 599.7011734000794 / 1.5;
  let camY = -241.5875220647641 / 1.5;
  let camZ = -226.6733292593074 / 1.5;
  let targetX = 0, targetY = 0, targetZ = 0;
  let upX = 0, upY = 1, upZ = 0;
  camera(camX, camY, camZ, targetX, targetY, targetZ, upX, upY, upZ);


}

function draw() {
  background(255);
  orbitControl();

  ambientLight(200);
  // directionalLight(200, 100, 100, -1, 1, 1);

  drawGrid();

  let axis_angle = createVector(sliderX.value(), sliderY.value(), sliderZ.value())

  // Draw reference sphere
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
      let x = sphere_radius * cos(a);
      let y = sphere_radius * sin(a);
      vertex(x, y, 0);
    }
    endShape(CLOSE);
    pop();
  }


  // draw singularities
  for (let vec of singularities[redundant_slider.value()]) {
    push();
    translate(vec[0] * sphere_radius, vec[1] * sphere_radius, vec[2] * sphere_radius);
    fill(250, 100, 100);
    strokeWeight(0.5);
    stroke(0);
    box(sphere_radius / cube_res);
    pop();
  }

  // draw axis angle
  drawAxisAngle(axis_angle, vector_length = sphere_radius);

  // draw gimbal
  let euler = quaternionToEuler(axisAngleToQuaternion(p5.Vector.normalize(axis_angle), axis_angle.mag()));
  push();
  // Outermost ring (Yaw, rotates around Z)
  rotate(euler.yaw, [0, 0, 1]);
  push();
  rotate(HALF_PI, [0, 1, 0]);
  drawRing(130, 3, color(200, 10, 10), 'z');
  pop();

  push();
  // Middle ring (Pitch, rotates around Y, but constrained by yaw)
  rotate(euler.pitch, [0, 1, 0]);
  drawRing(115, 3, color(10, 200, 10), 'y');

  push();
  // Innermost ring (Roll, rotates around X, but constrained by pitch)
  rotate(euler.roll + HALF_PI, [1, 0, 0]);
  drawRing(100, 3, color(10, 10, 200), 'x');

  // Draw the airplane inside the innermost ring
  scale(400);
  fill(255);
  stroke(0);
  strokeWeight(1);
  rotateX(PI);
  model(airplane_model);

  pop(); // End roll ring
  pop(); // End pitch ring
  pop(); // End yaw ring
}


function drawAxisAngle(axis_angle, vector_length = 1, shaftRadius = 1.5, ballRadius = 5, arrowColor = [250, 100, 100]) {
  push();
  noStroke();
  fill(arrowColor);
  emissiveMaterial(100, 50, 50);
  specularMaterial(10, 10, 10);

  let adjustedTheta = axis_angle.mag();
  let axis = axis_angle;

  // 4. Compute arrow magnitude (absolute value for length)
  let arrowMag = abs(adjustedTheta) / PI * vector_length;

  // 5. Compute the arrow vector (direction scaled by length)
  let arrowVec = axis.copy().normalize().mult(arrowMag);

  // 6. Now, we want to draw a cylinder along arrowVec.
  // p5’s cylinder is along the Y axis, so we need to rotate (0,1,0) into arrowVec.
  let defaultDir = createVector(0, 1, 0);
  let targetDir = arrowVec.copy().normalize();
  let rotAxis = defaultDir.copy().cross(targetDir);
  let rotAngle = acos(defaultDir.dot(targetDir));

  push();
  // If the target is opposite to the default, handle that edge-case:
  if (rotAxis.mag() < 0.0001) {
    if (defaultDir.dot(targetDir) < 0) {
      // Rotate 180 degrees around an arbitrary perpendicular axis.
      rotate(PI, [1, 0, 0]);
    }
    // Otherwise, no rotation needed.
  } else {
    rotAxis.normalize();
    rotate(rotAngle, [rotAxis.x, rotAxis.y, rotAxis.z]);
  }

  // 7. Draw the arrow shaft as a cylinder.
  // The cylinder is drawn centered on its Y axis, so translate by half the arrow magnitude.
  push();
  translate(0, arrowMag / 2, 0);
  cylinder(shaftRadius, arrowMag);
  pop();

  pop();

  // 8. Draw the arrow tip (ball) at the end of the arrow vector.
  push();
  translate(arrowVec.x, arrowVec.y, arrowVec.z);
  sphere(ballRadius);
  pop();

  pop();
}

function keyPressed() {
  let axis_angle = createVector(sliderX.value(), sliderY.value(), sliderZ.value())
  console.log(sliderX.value(), sliderY.value(), sliderZ.value());
  let euler = quaternionToEuler(axisAngleToQuaternion(p5.Vector.normalize(axis_angle), axis_angle.mag()));
  console.log(degrees(euler.yaw), degrees(euler.pitch), degrees(euler.roll));
}