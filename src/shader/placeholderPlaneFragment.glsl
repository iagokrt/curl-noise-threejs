varying vec2 vUv;

void main() {
  // Keep the UVs visible while this study is intentionally a blank canvas.
  gl_FragColor = vec4(vUv, 0.0, 1.0);
}
