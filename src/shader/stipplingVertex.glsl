attribute float aIndex;

uniform float u_width;
uniform float u_height;
uniform float u_particleSize;
uniform float u_nActiveParticles;
uniform sampler2D u_positionTexture;
uniform sampler2D u_bgTexture;
uniform vec2 u_textureOffset;
uniform float u_revealRadius;

varying float vInk;
varying float vMask;

float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

vec3 getBackgroundColor(vec3 position) {
  vec2 uv = (position.xy + u_textureOffset) / (2.0 * u_textureOffset);
  return texture2D(u_bgTexture, clamp(uv, 0.0, 1.0)).rgb;
}

void main() {
  if (aIndex >= u_nActiveParticles) {
    gl_PointSize = 0.0;
    gl_Position = vec4(-100000.0);
    return;
  }

  vec2 uv = vec2(
    (mod(aIndex, u_width) + 0.5) / u_width,
    (floor(aIndex / u_width) + 0.5) / u_height
  );

  vec3 position = texture2D(u_positionTexture, uv).xyz;
  float reveal = smoothstep(u_revealRadius, u_revealRadius - 0.85, length(position.xy));

  if (reveal <= 0.0) {
    gl_PointSize = 0.0;
    gl_Position = vec4(-100000.0);
    return;
  }

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vec3 bgColor = getBackgroundColor(position);
  vInk = 1.0 - luminance(bgColor);
  vInk = mix(0.25, 1.0, vInk);
  vMask = reveal;

  float relativeSize = 0.55 + vInk * 1.35;
  gl_PointSize = clamp(-u_particleSize * relativeSize / mvPosition.z, 1.0, 22.0);
  gl_Position = projectionMatrix * mvPosition;
}
