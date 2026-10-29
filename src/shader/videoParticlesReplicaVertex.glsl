uniform float uTime;
uniform float uDistortion;
uniform float uPointSize;

varying vec2 vUv;

vec4 permute(vec4 value) { return mod(value * value * 34.0 + value, 289.0); }

float snoise(vec3 value) {
  const vec2 c = 1.0 / vec2(6.0, 3.0);
  const vec4 d = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(value + dot(value, c.yyy));
  vec3 x0 = value - i + dot(i, c.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + c.xxx;
  vec3 x2 = x0 - i2 + c.yyy;
  vec3 x3 = x0 - d.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec3 ns = 0.142857142857 * d.wyz - d.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = floor(j - 7.0 * x_) * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + (floor(b0) * 2.0 + 1.0).xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + (floor(b1) * 2.0 + 1.0).xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = inversesqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  return 0.5 + 12.0 * dot(m * m * m, vec4(
    dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)
  ));
}

vec3 snoiseVec3(vec3 value) {
  return vec3(
    snoise(value * 2.0 - 1.0),
    snoise(vec3(value.y - 19.1, value.z + 33.4, value.x + 47.2)) * 2.0 - 1.0,
    snoise(vec3(value.z + 74.2, value.x - 124.5, value.y + 99.4) * 2.0 - 1.0)
  );
}

vec3 curlNoise(vec3 value) {
  const float e = 0.1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);
  vec3 px0 = snoiseVec3(value - dx);
  vec3 px1 = snoiseVec3(value + dx);
  vec3 py0 = snoiseVec3(value - dy);
  vec3 py1 = snoiseVec3(value + dy);
  vec3 pz0 = snoiseVec3(value - dz);
  vec3 pz1 = snoiseVec3(value + dz);
  float x = py1.z - py0.z - pz1.y + pz0.y;
  float y = pz1.x - pz0.x - px1.z + px0.z;
  float z = px1.y - px0.y - py1.x + py0.x;
  return normalize(vec3(x, y, z));
}

void main() {
  vUv = uv;
  vec3 field = curlNoise(vec3(
    position.x * 0.002 + uTime * 0.1,
    position.y * 0.008 + uTime * 0.1,
    (position.x + position.y) * 0.02
  ));
  vec3 distortion = vec3(position.x * 2.0, position.y, 1.0) * field * uDistortion;
  vec4 modelPosition = modelViewMatrix * vec4(position + distortion, 1.0);
  // The reference uses a fixed two-pixel point size at this world scale.
  gl_PointSize = uPointSize;
  gl_Position = projectionMatrix * modelPosition;
}
