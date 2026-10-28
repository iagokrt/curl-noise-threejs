uniform float uTime;
uniform float uScrollVelocity;
uniform float uDistortion;

varying vec2 vUv;

void main() {
  vUv = uv;

  vec3 transformed = position;
  float edge = sin(uv.y * 3.14159265);
  float wave = sin(uv.y * 8.0 + uTime * 0.75) * 0.5 + cos(uv.x * 7.0 - uTime * 0.45) * 0.5;
  float energy = min(abs(uScrollVelocity), 1.0);

  transformed.z += wave * uDistortion * (0.35 + energy * 1.5) * edge;
  transformed.x += sin(uv.y * 10.0 + uTime) * uDistortion * energy * 0.18;
  transformed.y += cos(uv.x * 8.0 - uTime * 0.8) * uDistortion * energy * 0.12;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
}
