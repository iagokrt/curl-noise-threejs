uniform sampler2D uTexture;
uniform float uTime;
uniform float uScrollVelocity;
uniform float uRgbShift;
uniform float uDistortion;
varying vec2 vUv;

void main() {
  vec2 uv = clamp(vUv, 0.001, 0.999);
  float energy = min(abs(uScrollVelocity), 1.0);
  float edge = smoothstep(0.02, 0.5, length(vUv - 0.5));
  float ripple = sin(vUv.y * 18.0 + uTime * 1.4) * 0.5 + 0.5;
  vec2 direction = normalize((vUv - 0.5) + vec2(0.001));
  vec2 shimmer = vec2(cos(uTime * 0.7), sin(uTime * 0.55)) * 0.0015;
  vec2 offset = direction * uRgbShift * (0.8 + energy * 3.2) * (0.55 + edge * 0.45);
  offset += shimmer * energy * (0.5 + ripple);

  float red = texture2D(uTexture, clamp(uv + offset, 0.001, 0.999)).r;
  float green = texture2D(uTexture, clamp(uv + offset * 0.08, 0.001, 0.999)).g;
  float blue = texture2D(uTexture, clamp(uv - offset, 0.001, 0.999)).b;

  vec3 color = vec3(red, green, blue);
  color += vec3(0.01, 0.0, 0.012) * energy;
  gl_FragColor = vec4(color, 1.0);
}
