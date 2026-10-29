uniform sampler2D uTexture;
uniform float uProgress;

varying vec2 vUv;
varying float vExplosion;

void main() {
  vec2 point = gl_PointCoord - 0.5;
  float circle = 1.0 - smoothstep(0.38, 0.5, length(point));
  if (circle <= 0.01) discard;

  vec4 image = texture2D(uTexture, vUv);
  float glow = 1.0 + vExplosion * 1.8;
  vec3 explosionTint = vec3(0.08, 0.18, 0.38) * vExplosion;
  gl_FragColor = vec4(image.rgb * glow + explosionTint, image.a * circle);
}
