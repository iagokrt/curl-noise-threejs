precision highp float;

uniform float u_dt;
uniform float u_nActiveParticles;
uniform sampler2D u_bgTexture;
uniform vec2 u_textureOffset;
uniform float u_repulsion;
uniform float u_revealRadius;

vec3 getBackgroundColor(vec3 position) {
  vec2 uv = (position.xy + u_textureOffset) / (2.0 * u_textureOffset);
  return texture2D(u_bgTexture, clamp(uv, 0.0, 1.0)).rgb;
}

float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float chargeSize(vec3 bgColor) {
  float paper = luminance(bgColor);
  return 0.040 + 0.070 * pow(paper, 1.8);
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  float index = (gl_FragCoord.x - 0.5) + (gl_FragCoord.y - 0.5) * resolution.x;
  vec3 position = texture2D(u_positionTexture, uv).xyz;
  float reveal = smoothstep(u_revealRadius + 0.18, u_revealRadius - 0.18, length(position.xy));

  if (index >= u_nActiveParticles || reveal <= 0.0) {
    gl_FragColor = texture2D(u_velocityTexture, uv);
    return;
  }

  vec3 bgColor = getBackgroundColor(position);
  float charge = chargeSize(bgColor);
  vec3 totalForce = vec3(0.0);

  for (float i = 0.0; i < 5184.0; i++) {
    if (i >= u_nActiveParticles) {
      break;
    }

    vec2 particleUv = vec2(mod(i, resolution.x) + 0.5, floor(i / resolution.x) + 0.5) / resolution.xy;
    vec3 particlePosition = texture2D(u_positionTexture, particleUv).xyz;
    float particleReveal = smoothstep(u_revealRadius + 0.18, u_revealRadius - 0.18, length(particlePosition.xy));

    if (particleReveal <= 0.0) {
      continue;
    }

    vec3 particleBgColor = getBackgroundColor(particlePosition);
    float totalCharge = charge + chargeSize(particleBgColor);
    vec3 forceDirection = position - particlePosition;
    float distanceToParticle = length(forceDirection);

    if (distanceToParticle > 0.0001 && distanceToParticle < totalCharge) {
      totalForce += u_repulsion * pow(totalCharge / (distanceToParticle + 0.035), 2.0) * (forceDirection / distanceToParticle);
    }
  }

  vec2 uvTarget = (position.xy + u_textureOffset) / (2.0 * u_textureOffset);
  vec2 edgeForce = vec2(0.0);
  edgeForce += vec2(smoothstep(0.08, 0.0, uvTarget.x), 0.0);
  edgeForce -= vec2(smoothstep(0.08, 0.0, 1.0 - uvTarget.x), 0.0);
  edgeForce += vec2(0.0, smoothstep(0.08, 0.0, uvTarget.y));
  edgeForce -= vec2(0.0, smoothstep(0.08, 0.0, 1.0 - uvTarget.y));

  totalForce.xy += edgeForce * 0.018;
  gl_FragColor = vec4(u_dt * totalForce, 1.0);
}
