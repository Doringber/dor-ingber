export type Vec3 = [number, number, number];

export function createMat4(): Float32Array {
  return new Float32Array(16);
}

export function identity(out: Float32Array = createMat4()): Float32Array {
  out.fill(0);
  out[0] = 1;
  out[5] = 1;
  out[10] = 1;
  out[15] = 1;
  return out;
}

export function perspectiveZO(
  out: Float32Array,
  fovy: number,
  aspect: number,
  near: number,
  far: number,
): Float32Array {
  const f = 1 / Math.tan(fovy / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = far / (near - far);
  out[11] = -1;
  out[14] = (far * near) / (near - far);
  return out;
}

export function lookAt(
  out: Float32Array,
  eye: Vec3,
  target: Vec3,
  up: Vec3,
): Float32Array {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  let len = Math.hypot(zx, zy, zz) || 1;
  zx /= len;
  zy /= len;
  zz /= len;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz) || 1;
  xx /= len;
  xy /= len;
  xz /= len;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  out[0] = xx;
  out[1] = yx;
  out[2] = zx;
  out[3] = 0;
  out[4] = xy;
  out[5] = yy;
  out[6] = zy;
  out[7] = 0;
  out[8] = xz;
  out[9] = yz;
  out[10] = zz;
  out[11] = 0;
  out[12] = -(xx * eye[0] + xy * eye[1] + xz * eye[2]);
  out[13] = -(yx * eye[0] + yy * eye[1] + yz * eye[2]);
  out[14] = -(zx * eye[0] + zy * eye[1] + zz * eye[2]);
  out[15] = 1;
  return out;
}

export function multiply(
  out: Float32Array,
  a: Float32Array,
  b: Float32Array,
): Float32Array {
  const result = out === a || out === b ? createMat4() : out;

  for (let col = 0; col < 4; col += 1) {
    const b0 = b[col * 4];
    const b1 = b[col * 4 + 1];
    const b2 = b[col * 4 + 2];
    const b3 = b[col * 4 + 3];
    result[col * 4] = a[0] * b0 + a[4] * b1 + a[8] * b2 + a[12] * b3;
    result[col * 4 + 1] = a[1] * b0 + a[5] * b1 + a[9] * b2 + a[13] * b3;
    result[col * 4 + 2] = a[2] * b0 + a[6] * b1 + a[10] * b2 + a[14] * b3;
    result[col * 4 + 3] = a[3] * b0 + a[7] * b1 + a[11] * b2 + a[15] * b3;
  }

  if (result !== out) {
    out.set(result);
  }
  return out;
}

export function fromTranslation(
  out: Float32Array,
  x: number,
  y: number,
  z: number,
): Float32Array {
  identity(out);
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
}

export function fromScaling(
  out: Float32Array,
  x: number,
  y: number,
  z: number,
): Float32Array {
  identity(out);
  out[0] = x;
  out[5] = y;
  out[10] = z;
  return out;
}

export function transformPoint(
  out: Vec3,
  matrix: Float32Array,
  point: Vec3,
): Vec3 {
  const x = point[0];
  const y = point[1];
  const z = point[2];
  const w = matrix[3] * x + matrix[7] * y + matrix[11] * z + matrix[15] || 1;
  out[0] = (matrix[0] * x + matrix[4] * y + matrix[8] * z + matrix[12]) / w;
  out[1] = (matrix[1] * x + matrix[5] * y + matrix[9] * z + matrix[13]) / w;
  out[2] = (matrix[2] * x + matrix[6] * y + matrix[10] * z + matrix[14]) / w;
  return out;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerpVec3(out: Vec3, a: Vec3, b: Vec3, t: number): Vec3 {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
  return out;
}
