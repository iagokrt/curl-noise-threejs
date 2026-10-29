uniform float uTime;
uniform float uProgress;
uniform float uDistortion;
uniform float uPointSize;
uniform float uMomentum;
uniform float uNatural;
uniform float uAnimation;
uniform float uReturning;
uniform float uReturnCurve;
uniform sampler2D uTexture;

varying vec2 vUv;
varying float vExplosion;

float hash(vec3 value) {
  return fract(sin(dot(value, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

vec3 randomDirection(vec3 value) {
  return normalize(vec3(
    hash(value + 1.7) - 0.5,
    hash(value + 8.2) - 0.5,
    hash(value + 3.4) - 0.5
  ));
}

// Curl field adapted from the original particle-study vertex shader. Unlike
// independent random vectors, this gives neighboring samples a shared flow,
// which is what made the old plane feel fluid instead of mechanically noisy.
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
  vExplosion = uProgress;

  float seed = hash(vec3(uv, 0.41));
  vec3 direction = randomDirection(vec3(uv * 17.0, seed));
  vec3 color = texture2D(uTexture, uv).rgb;
  float luminance = dot(color, vec3(0.299, 0.587, 0.114));
  float distance = 0.85 + seed * 2.25 + luminance * 1.35;
  float progress = smoothstep(0.0, 1.0, uProgress);
  float outwardLaunch = pow(progress, 0.68);
  // The return is intentionally a different curve: it collapses quickly at
  // first, then leaves a soft settling tail instead of retracing linearly.
  float returnLaunch = pow(progress, uReturnCurve);
  float launch = mix(outwardLaunch, returnLaunch, uReturning);
  float wave = sin(uTime * 2.0 + seed * 18.0) * 0.12;
  vec3 flow = curlNoise(vec3(
    position.x * 1.25 - uTime * 0.11 * uAnimation,
    position.y * 0.68 + uTime * 0.035 * uAnimation,
    0.0
  ));

  vec3 displaced = position;
  // A perfectly regular PlaneBufferGeometry makes the particle image read as
  // a visible screen-space lattice. Offset each sample by a fraction of its
  // cell so the reconstruction feels granular instead of tiled.
  vec2 grain = vec2(
    hash(vec3(uv * 431.7, 1.9)),
    hash(vec3(uv * 157.3, 8.4))
  ) - 0.5;
  displaced.xy += grain * 0.014;
  // Keep a restrained version of the old plane deformation while the image
  // is assembled. It fades during the launch so the explosion still reads.
  displaced += vec3(position.xy, 0.0) * flow * (0.12 * uNatural) * uAnimation * (1.0 - progress * 0.8);
  displaced += flow * uMomentum * 0.08 * launch * uAnimation;
  displaced += direction * (distance + wave + uMomentum * (0.45 + seed * 0.8)) * launch * (0.35 + uDistortion);
  float latticeBreak = smoothstep(0.02, 0.28, progress) * (seed - 0.5) * 0.018;
  displaced.xy += direction.xy * latticeBreak;
  displaced.xy += vec2(
    sin(uv.y * 16.0 + uTime) * 0.08,
    cos(uv.x * 13.0 - uTime * 0.8) * 0.08
  ) * launch * uDistortion;

  vec4 modelPosition = modelViewMatrix * vec4(displaced, 1.0);
  float pointVariation = mix(0.78, 1.22, hash(vec3(uv * 89.0, 4.7)));
  gl_PointSize = uPointSize * pointVariation * (1.0 + progress * 0.75 + uMomentum * 0.18) * (300.0 / -modelPosition.z);
  gl_Position = projectionMatrix * modelPosition;
}
