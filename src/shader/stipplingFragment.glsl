precision highp float;

varying float vInk;
varying float vMask;

void main() {
  vec2 p = gl_PointCoord - 0.5;
  float alpha = smoothstep(0.5, 0.12, length(p));
  vec3 ink = mix(vec3(0.10, 0.085, 0.055), vec3(0.0), smoothstep(0.0, 0.9, vInk));

  gl_FragColor = vec4(ink, alpha * (0.30 + vInk * 0.70) * vMask);
}
