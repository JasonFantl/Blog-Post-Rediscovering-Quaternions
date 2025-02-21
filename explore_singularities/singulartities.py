import math
import json


def vector_to_quaternion(vector):
    """
    Convert a 3D vector to a quaternion.
    The vector’s magnitude divided by 2 is used as the half-angle.
    """
    x, y, z = vector
    mag = math.sqrt(x * x + y * y + z * z)
    if mag == 0:
        return (1, 0, 0, 0)  # handle zero vector case
    # Normalize the vector to get the rotation axis.
    axis = (x / mag, y / mag, z / mag)
    half_angle = mag / 2.0
    sin_half = math.sin(half_angle)
    return (
        math.cos(half_angle),
        axis[0] * sin_half,
        axis[1] * sin_half,
        axis[2] * sin_half,
    )


def quaternion_to_euler(q):
    """
    Convert a quaternion (w,x,y,z) to Euler angles (yaw, pitch, roll).
    The equations follow the standard conversion.
    """
    w, x, y, z = q
    ysqr = y * y

    t0 = 2.0 * (w * x + y * z)
    t1 = 1.0 - 2.0 * (x * x + ysqr)
    roll = math.atan2(t0, t1)

    t2 = 2.0 * (w * y - z * x)
    # Clamp t2 to be within [-1, 1]
    t2 = max(min(t2, 1.0), -1.0)
    pitch = math.asin(t2)

    t3 = 2.0 * (w * z + x * y)
    t4 = 1.0 - 2.0 * (ysqr + z * z)
    yaw = math.atan2(t3, t4)

    return {"yaw": yaw, "pitch": pitch, "roll": roll}


def main():
    cube_res = 80  # resolution: N points per dimension
    saved_points = []
    tol = 0.06  # tolerance (in radians) for being "near" 90° (pi/2)

    # Calculate the half-grid length (for symmetric coordinates).
    half_grid = (cube_res - 1) / 2.0

    # Loop over each point in the cube.
    for i in range(cube_res):
        # Map index i to coordinate in [-1, 1]
        x = (i - half_grid) / half_grid
        for j in range(cube_res):
            y = (j - half_grid) / half_grid
            for k in range(cube_res):
                z = (k - half_grid) / half_grid
                # Only consider points inside the sphere (radius = 1).
                if x * x + y * y + z * z > 1:
                    continue
                vector = (x * math.pi, y * math.pi, z * math.pi)
                q = vector_to_quaternion(vector)
                euler = quaternion_to_euler(q)
                pitch = euler["pitch"]
                # Check if the absolute pitch is nearly 90° (pi/2 radians).
                if abs(abs(pitch) - (math.pi / 2)) < tol:
                    saved_points.append([x, y, z])

    # Create the JSON structure.
    output = {"cube_res": cube_res, "points": [saved_points]}

    # Save to a file.
    with open("singularities.json", "w") as f:
        json.dump(output, f, indent=2)


if __name__ == "__main__":
    main()
