precision highp float;

uniform float u_dt;
uniform float u_nActiveParticles;
uniform float u_revealRadius;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float index = (gl_FragCoord.x - 0.5) + (gl_FragCoord.y - 0.5) * resolution.x;

  vec3 position = texture2D(u_positionTexture, uv).xyz;
  vec3 velocity = texture2D(u_velocityTexture, uv).xyz;
  float reveal = smoothstep(u_revealRadius + 0.18, u_revealRadius - 0.18, length(position.xy));

  if (index < u_nActiveParticles && reveal > 0.0) {
    gl_FragColor = vec4(position + u_dt * velocity, 1.0);
  } else {
    gl_FragColor = vec4(position, 1.0);
  }
}
