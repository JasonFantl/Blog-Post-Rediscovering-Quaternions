function eulerToQuaternion(yaw, pitch, roll) {
    let cy = cos(yaw * 0.5);
    let sy = sin(yaw * 0.5);
    let cp = cos(pitch * 0.5);
    let sp = sin(pitch * 0.5);
    let cr = cos(roll * 0.5);
    let sr = sin(roll * 0.5);

    return {
        w: cy * cp * cr + sy * sp * sr,
        x: cy * cp * sr - sy * sp * cr,
        y: sy * cp * sr + cy * sp * cr,
        z: sy * cp * cr - cy * sp * sr
    };
}

function quaternionToEuler(q) {
    let ysqr = q.y * q.y;

    let t0 = 2.0 * (q.w * q.x + q.y * q.z);
    let t1 = 1.0 - 2.0 * (q.x * q.x + ysqr);
    let roll = atan2(t0, t1);

    let t2 = 2.0 * (q.w * q.y - q.z * q.x);
    t2 = t2 > 1.0 ? 1.0 : t2;
    t2 = t2 < -1.0 ? -1.0 : t2;
    let pitch = asin(t2);

    let t3 = 2.0 * (q.w * q.z + q.x * q.y);
    let t4 = 1.0 - 2.0 * (ysqr + q.z * q.z);
    let yaw = atan2(t3, t4);

    return { yaw, pitch, roll };
}

function slerp(q1, q2, t) {
    // Dot product to determine angle between them
    let dot = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;

    // If dot is negative, slerp the opposite of q2 to take the shorter arc
    if (dot < 0.0) {
        q2 = {
            w: -q2.w,
            x: -q2.x,
            y: -q2.y,
            z: -q2.z
        };
        dot = -dot;
    }

    // If the quaternions are very close, approximate by linear interpolation (LERP)
    const THRESHOLD = 0.9995;
    if (dot > THRESHOLD) {
        // Perform a linear interpolation and normalize at the end
        let w = q1.w + t * (q2.w - q1.w);
        let x = q1.x + t * (q2.x - q1.x);
        let y = q1.y + t * (q2.y - q1.y);
        let z = q1.z + t * (q2.z - q1.z);

        // Normalize result
        const mag = sqrt(w * w + x * x + y * y + z * z);
        return {
            w: w / mag,
            x: x / mag,
            y: y / mag,
            z: z / mag
        };
    }

    // ---- Standard SLERP ----
    // theta_0 is the angle between q1 and q2
    let theta_0 = acos(dot);      // in [0..π]
    let sin_theta_0 = sin(theta_0);

    // Compute slerp weights
    let s0 = sin((1 - t) * theta_0) / sin_theta_0;
    let s1 = sin(t * theta_0) / sin_theta_0;

    return {
        w: s0 * q1.w + s1 * q2.w,
        x: s0 * q1.x + s1 * q2.x,
        y: s0 * q1.y + s1 * q2.y,
        z: s0 * q1.z + s1 * q2.z
    };
}

function applyQuaternion(q) {
    // Angle = 2 * arccos(w), axis = (x/s, y/s, z/s)
    let angle = 2 * acos(q.w);
    if (angle > PI) {
        angle = angle - TWO_PI;
    }
    let s = sqrt(1 - q.w * q.w);

    // Avoid division by zero near angle = 0
    if (s < 0.0001) {
        // No rotation needed
        return;
    }

    // Apply the axis-angle rotation in p5
    rotate(angle, [q.x / s, q.y / s, q.z / s]);
}

function axisAngleToQuaternion(axis, angle) {
    let half = angle / 2;
    return {
        w: cos(half),
        x: axis.x * sin(half),
        y: axis.y * sin(half),
        z: axis.z * sin(half)
    };
}

function quaternionToAxisAngle(q) {
    if (Math.abs(q.w) > 0.9999) {
        return { axis: { x: 1, y: 0, z: 0 }, angle: 0 };
    }

    let angle = 2 * Math.acos(q.w);
    let s = Math.sqrt(1 - q.w * q.w);

    if (s < 0.0001) {
        return { axis: { x: q.x, y: q.y, z: q.z }, angle };
    }

    let axis = { x: q.x / s, y: q.y / s, z: q.z / s };

    if (angle > Math.PI) {
        angle = 2 * Math.PI - angle;
        axis.x = -axis.x;
        axis.y = -axis.y;
        axis.z = -axis.z;
    }

    return { axis, angle };
}


function pseudoRandomQuaternion(t) {
    // Use trigonometric functions with phase shifts for smooth randomness
    let w = cos(-t * 0.5 + 1);
    let x = sin(-t * 0.3);
    let y = cos(t * 0.2 + 1);
    let z = sin(t * 0.2 + 2);

    // Normalize to ensure a valid rotation quaternion
    let mag = sqrt(w * w + x * x + y * y + z * z);
    return { w: w / mag, x: x / mag, y: y / mag, z: z / mag };
}

function pseudoRandom2DQuaternion(t) {
    // Use trigonometric functions with phase shifts for smooth randomness
    let w = cos(-t * 0.5 + 1);
    let x = 0;
    let y = cos(t * 0.2 + 1);
    let z = sin(t * 0.2 + 2);

    // Normalize to ensure a valid rotation quaternion
    let mag = sqrt(w * w + x * x + y * y + z * z);
    return { w: w / mag, x: x / mag, y: y / mag, z: z / mag };
}


function drawRodriguesVector(quaternion, vector_length = 1, shaftRadius = 1.5, ballRadius = 5, arrowColor = [250, 100, 100]) {
    push();
    noStroke();
    fill(arrowColor);
    emissiveMaterial(100, 50, 50);
    specularMaterial(10, 10, 10);

    let axis_angle = quaternionToAxisAngle(quaternion);
    let adjustedTheta = axis_angle.angle;
    let axis = createVector(axis_angle.axis.x, axis_angle.axis.y, axis_angle.axis.z);

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

function drawGrid(size = 10000, divisions = 200) {
    let step = size / divisions;
    let halfSize = size / 2;

    push();
    stroke(180);
    strokeWeight(1);

    // Move the grid to the bottom of the outermost ring
    translate(0, 180, 0);

    // Draw lines along X-axis
    for (let x = -halfSize; x <= halfSize; x += step) {
        line(x, 0, -halfSize, x, 0, halfSize);
    }

    // Draw lines along Z-axis
    for (let z = -halfSize; z <= halfSize; z += step) {
        line(-halfSize, 0, z, halfSize, 0, z);
    }

    pop();
}


function drawRing(ringRadius, thickness, ringColor, axis) {
    push();
    noStroke();
    fill(ringColor);

    // Use many segments along the ring for smoothness
    let mainSegments = 100;
    // Define rectangle half-dimensions for the tube cross-section.
    // Tube width is 'thickness', and height is 1.2 times that.
    let halfW = thickness;
    let halfH = (thickness * 1.5);

    rotateX(HALF_PI);

    // -- Outer face (the side pointing radially outward) --
    beginShape(TRIANGLE_STRIP);
    for (let i = 0; i <= mainSegments; i++) {
        let u = TWO_PI * i / mainSegments;
        let cu = cos(u), su = sin(u);
        // Center of the tube at this segment (main circle in xz)
        let cx = ringRadius * cu;
        let cz = ringRadius * su;
        // Local radial direction is (cu, 0, su) and vertical is (0,1,0)
        // For the outer face the cross-section offset is (halfW, ±halfH)
        // Lower vertex
        normal(cu, 0, su);
        vertex(cx + cu * halfW, -halfH, cz + su * halfW);
        // Upper vertex
        normal(cu, 0, su);
        vertex(cx + cu * halfW, halfH, cz + su * halfW);
    }
    endShape(CLOSE);

    // -- Inner face (facing inward) --
    beginShape(TRIANGLE_STRIP);
    for (let i = 0; i <= mainSegments; i++) {
        let u = TWO_PI * i / mainSegments;
        let cu = cos(u), su = sin(u);
        let cx = ringRadius * cu;
        let cz = ringRadius * su;
        // For inner face, offset is -halfW and normal points inward.
        normal(-cu, 0, -su);
        vertex(cx - cu * halfW, -halfH, cz - su * halfW);
        normal(-cu, 0, -su);
        vertex(cx - cu * halfW, halfH, cz - su * halfW);
    }
    endShape(CLOSE);

    // -- Top face (facing upward) --
    beginShape(TRIANGLE_STRIP);
    for (let i = 0; i <= mainSegments; i++) {
        let u = TWO_PI * i / mainSegments;
        let cu = cos(u), su = sin(u);
        let cx = ringRadius * cu;
        let cz = ringRadius * su;
        // Top face: vertical offset is +halfH; we vary along the radial direction.
        normal(0, 1, 0);
        vertex(cx - cu * halfW, halfH, cz - su * halfW);
        normal(0, 1, 0);
        vertex(cx + cu * halfW, halfH, cz + su * halfW);
    }
    endShape(CLOSE);

    // -- Bottom face (facing downward) --
    beginShape(TRIANGLE_STRIP);
    for (let i = 0; i <= mainSegments; i++) {
        let u = TWO_PI * i / mainSegments;
        let cu = cos(u), su = sin(u);
        let cx = ringRadius * cu;
        let cz = ringRadius * su;
        normal(0, -1, 0);
        vertex(cx - cu * halfW, -halfH, cz - su * halfW);
        normal(0, -1, 0);
        vertex(cx + cu * halfW, -halfH, cz + su * halfW);
    }
    endShape(CLOSE);


    // --- Draw outlines for all 4 ridges ---
    stroke(0);         // Set outline color (black here)
    strokeWeight(0.5);   // Adjust as needed
    noFill();

    // Outer Top Ridge
    beginShape();
    for (let i = 0; i <= mainSegments; i++) {
        let u = TWO_PI * i / mainSegments;
        let cu = cos(u), su = sin(u);
        let cx = ringRadius * cu;
        let cz = ringRadius * su;
        vertex(cx + cu * halfW, halfH, cz + su * halfW);
    }
    endShape(CLOSE);

    // Outer Bottom Ridge
    beginShape();
    for (let i = 0; i <= mainSegments; i++) {
        let u = TWO_PI * i / mainSegments;
        let cu = cos(u), su = sin(u);
        let cx = ringRadius * cu;
        let cz = ringRadius * su;
        vertex(cx + cu * halfW, -halfH, cz + su * halfW);
    }
    endShape(CLOSE);

    // Inner Top Ridge
    beginShape();
    for (let i = 0; i <= mainSegments; i++) {
        let u = TWO_PI * i / mainSegments;
        let cu = cos(u), su = sin(u);
        let cx = ringRadius * cu;
        let cz = ringRadius * su;
        vertex(cx - cu * halfW, halfH, cz - su * halfW);
    }
    endShape(CLOSE);

    // Inner Bottom Ridge
    beginShape();
    for (let i = 0; i <= mainSegments; i++) {
        let u = TWO_PI * i / mainSegments;
        let cu = cos(u), su = sin(u);
        let cx = ringRadius * cu;
        let cz = ringRadius * su;
        vertex(cx - cu * halfW, -halfH, cz - su * halfW);
    }
    endShape(CLOSE);



    // --- Attach spheres (unchanged) ---
    fill(0);
    for (let i of [-1, 1]) {
        push();
        switch (axis) {
            case 'x':
                rotateZ(HALF_PI);
                break;
            case 'z':
                rotateZ(HALF_PI);
                break;
            case 'y':
                rotateX(HALF_PI);
                break;
        }
        let ball_size = 7;
        translate(0, i * (ringRadius + ball_size), 0);
        sphere(ball_size);
        pop();
    }
    pop();
}

function rotateVectorByQuaternion(v, q) {
    // q: {x, y, z, w} and v: p5.Vector
    let u = createVector(q.x, q.y, q.z);
    // uv = u x v (cross product)
    let uv = p5.Vector.cross(u, v);
    // uuv = u x uv
    let uuv = p5.Vector.cross(u, uv);

    uv.mult(2 * q.w);
    uuv.mult(2);

    return p5.Vector.add(v, p5.Vector.add(uv, uuv));
}


function multiplyQuaternions(q1, q2) {
    return {
        w: q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
        x: q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
        y: q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
        z: q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w
    };
}
