uniform sampler2D uTextureA;
uniform sampler2D uTextureB;
uniform float uProgress;

varying vec2 vUv;

// A tiny, stable per-particle value keeps every point from changing texture
// on the exact same frame. The stagger is subtle, but removes the visible
// rectangular crossfade and makes the recomposition feel like particles.
float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec4 a = texture2D(uTextureA, vUv);
  vec4 b = texture2D(uTextureB, vUv);
  float seed = hash21(vUv * 4096.0);
  float localProgress = smoothstep(
    0.20 + (seed - 0.5) * 0.22,
    0.80 + (seed - 0.5) * 0.22,
    uProgress
  );
  vec4 image = mix(a, b, localProgress);
  float luminance = max(max(image.r, image.g), image.b);
  if (luminance < 0.015) discard;
  // So dark particles dissolve instead of popping out at the threshold.
  float alpha = smoothstep(0.015, 0.09, luminance);
  gl_FragColor = vec4(image.rgb, alpha);
}
