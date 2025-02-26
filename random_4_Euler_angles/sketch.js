let airplane_model;
let t = 20.0; // time parameter
// Initial 4-DOF state: [alpha, beta, gamma, delta]
// Note: delta is the redundant inner-most rotation (about Y)
let gimbalState = [0, 0, 0, 0];
const EPSILON = 0.1;      // search neighborhood in radians
const NUM_SAMPLES = 50;   // number of candidate delta values
const SPEED_WEIGHT = 2.0; // penalty weight for change in delta only

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
  let targetX = 0, targetY = 0, targetZ = 0;
  let upX = 0, upY = 1, upZ = 0;
  camera(camX, camY, camZ, targetX, targetY, targetZ, upX, upY, upZ);

  createLoop({ duration: 300.0 / 30.0, gif: true })

}

function draw() {
  background(255);
  orbitControl();
  lights();
  ambientLight(100);

  t += 0.05;

  // Get next rotation from our pseudo-random quaternion function.
  let q = pseudoRandomQuaternion(t);
  let R_next = quatToMatrix(q);

  // Update the 4-DOF gimbal state using our tick-by-tick formulation.
  gimbalState = updateGimbalState(gimbalState, R_next);

  drawGrid();

  // Extract the gimbal angles
  let [alpha, beta, gamma, delta] = gimbalState;

  // Draw the 4-DOF gimbal system.
  push();
  // Outer ring: rotation about Z (yaw)
  rotate(alpha, [0, 0, 1]);
  push();
  // Outer ring visualization
  rotate(HALF_PI, [0, 1, 0]);
  drawRing(130, 3, color(200, 10, 10), 'z');
  pop();

  push();
  // Middle ring: rotation about Y (pitch)
  rotate(beta, [0, 1, 0]);
  drawRing(115, 3, color(10, 200, 10), 'y');

  push();
  // Third ring: rotation about X (roll)
  rotate(gamma, [1, 0, 0]);
  drawRing(100, 3, color(10, 10, 200), 'x');

  push();
  // Innermost (redundant) ring: rotation about Y by delta
  rotate(delta, [0, 1, 0]);
  drawRing(85, 3, color(200, 200, 10), 'y');

  // Draw the airplane model inside the innermost ring.
  scale(400);
  fill(255);
  stroke(0);
  strokeWeight(1);
  rotateX(PI);
  model(airplane_model);
  pop(); // end innermost ring
  pop(); // end third ring
  pop(); // end middle ring
  pop(); // end outer ring

  // Draw reference cylinders.
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

  // // Reference airplane
  // push();
  // translate(0, 100, 0);
  // applyQuaternion(q);
  // scale(400);
  // fill(255);
  // stroke(0);
  // strokeWeight(1);
  // rotateX(PI);
  // model(airplane_model);
  // pop();
}

// ===================== Helper Functions =====================

// Rotation matrix about Z
function rotZ(angle) {
  return [
    [Math.cos(angle), -Math.sin(angle), 0],
    [Math.sin(angle), Math.cos(angle), 0],
    [0, 0, 1]
  ];
}

// Rotation matrix about Y
function rotY(angle) {
  return [
    [Math.cos(angle), 0, Math.sin(angle)],
    [0, 1, 0],
    [-Math.sin(angle), 0, Math.cos(angle)]
  ];
}

// Rotation matrix about X
function rotX(angle) {
  return [
    [1, 0, 0],
    [0, Math.cos(angle), -Math.sin(angle)],
    [0, Math.sin(angle), Math.cos(angle)]
  ];
}

// Multiply two 3x3 matrices.
function multiplyMatrices(a, b) {
  let result = [];
  for (let i = 0; i < 3; i++) {
    result[i] = [];
    for (let j = 0; j < 3; j++) {
      result[i][j] = 0;
      for (let k = 0; k < 3; k++) {
        result[i][j] += a[i][k] * b[k][j];
      }
    }
  }
  return result;
}

// Convert a quaternion (format {x, y, z, w}) to a 3x3 rotation matrix.
function quatToMatrix(q) {
  let x = q.x, y = q.y, z = q.z, w = q.w;
  let m00 = 1 - 2 * y * y - 2 * z * z;
  let m01 = 2 * x * y - 2 * z * w;
  let m02 = 2 * x * z + 2 * y * w;
  let m10 = 2 * x * y + 2 * z * w;
  let m11 = 1 - 2 * x * x - 2 * z * z;
  let m12 = 2 * y * z - 2 * x * w;
  let m20 = 2 * x * z - 2 * y * w;
  let m21 = 2 * y * z + 2 * x * w;
  let m22 = 1 - 2 * x * x - 2 * y * y;
  return [
    [m00, m01, m02],
    [m10, m11, m12],
    [m20, m21, m22]
  ];
}

// Given R_next and a candidate redundant parameter delta,
// compute the candidate gimbal state [alpha, beta, gamma, delta].
// Here we “remove” the redundant rotation about Y.
function candidateGimbalState(R_next, delta) {
  let Ry_minus = rotY(-delta);
  let tildeR = multiplyMatrices(R_next, Ry_minus);
  let alpha = Math.atan2(tildeR[1][0], tildeR[0][0]);
  let beta = Math.asin(-tildeR[2][0]);
  let gamma = Math.atan2(tildeR[2][1], tildeR[2][2]);
  return [alpha, beta, gamma, delta];
}

// Safety function using the actual determinant of JJ^T.
// (We assume FK(α,β,γ,δ) = R_z(α) R_y(β) R_x(γ) R_z(δ) for safety,
// but note that our candidate function uses a redundant rotation about Y.
// In a real system, you would ensure consistency between these models.)
function safety(gimbal) {
  let alpha = gimbal[0];
  let beta = gimbal[1];
  let gamma = gimbal[2];
  let delta = gimbal[3];

  // A1: rotation about Z in base frame
  let A1 = [0, 0, 1];

  // A2: second joint, axis = R_z(α)(0,1,0)
  let A2 = [-Math.sin(alpha), Math.cos(alpha), 0];

  // A3: third joint, axis = R_z(α) R_y(β)(1,0,0)
  let A3 = [Math.cos(alpha) * Math.cos(beta), Math.sin(alpha) * Math.cos(beta), -Math.sin(beta)];

  // A4: fourth joint, axis = R_z(α) R_y(β) R_x(γ)(0,0,1)
  // Compute R_x(γ)(0,0,1)
  let temp = [0, -Math.sin(gamma), Math.cos(gamma)];
  // Then R_y(β) on temp: R_y(β)*temp = [ sinβ*cosγ, - sinγ, cosβ*cosγ ]
  let temp2 = [Math.sin(beta) * Math.cos(gamma), -Math.sin(gamma), Math.cos(beta) * Math.cos(gamma)];
  // Then R_z(α) on temp2:
  let A4_x = Math.cos(alpha) * temp2[0] - Math.sin(alpha) * temp2[1];
  let A4_y = Math.sin(alpha) * temp2[0] + Math.cos(alpha) * temp2[1];
  let A4_z = temp2[2];
  let A4 = [A4_x, A4_y, A4_z];

  // Form the 3x3 matrix M = A1*A1^T + A2*A2^T + A3*A3^T + A4*A4^T.
  let M = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];
  let axes = [A1, A2, A3, A4];
  for (let k = 0; k < 4; k++) {
    let A = axes[k];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        M[i][j] += A[i] * A[j];
      }
    }
  }

  // Compute determinant of 3x3 matrix M:
  let detM = M[0][0] * (M[1][1] * M[2][2] - M[1][2] * M[2][1])
    - M[0][1] * (M[1][0] * M[2][2] - M[1][2] * M[2][0])
    + M[0][2] * (M[1][0] * M[2][1] - M[1][1] * M[2][0]);
  return detM;
}

// Update the gimbal state given the current state and next rotation R_next.
// We now incorporate both safety and a speed penalty that penalizes only the change in delta.
function updateGimbalState(currentState, R_next) {
  let currentDelta = currentState[3];
  let bestDelta = currentDelta;
  let bestObjective = -Infinity;

  // Sample candidate delta values in [currentDelta - EPSILON, currentDelta + EPSILON]
  for (let i = 0; i < NUM_SAMPLES; i++) {
    let deltaCandidate = currentDelta - EPSILON + (2 * EPSILON) * (i / (NUM_SAMPLES - 1));
    let candidate = candidateGimbalState(R_next, deltaCandidate);
    let candidateSafety = safety(candidate);
    // Penalize change only in delta:
    let deltaDiff = deltaCandidate - currentDelta;
    let speedPenalty = deltaDiff * deltaDiff;
    let candidateObjective = candidateSafety - SPEED_WEIGHT * speedPenalty;
    if (candidateObjective > bestObjective) {
      bestObjective = candidateObjective;
      bestDelta = deltaCandidate;
    }
  }

  return candidateGimbalState(R_next, bestDelta);
}

// Dummy pseudoRandomQuaternion function.
// Replace with your actual implementation.
function pseudoRandomQuaternion(t) {
  // For example, a slow rotation about the y-axis.
  let angle = t * 0.1;
  let axis = { x: 0, y: 1, z: 0 };
  let sinHalf = Math.sin(angle / 2);
  let cosHalf = Math.cos(angle / 2);
  return {
    x: axis.x * sinHalf,
    y: axis.y * sinHalf,
    z: axis.z * sinHalf,
    w: cosHalf
  };
}
