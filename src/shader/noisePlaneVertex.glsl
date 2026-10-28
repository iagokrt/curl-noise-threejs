uniform float time;
uniform sampler2D positionTexture;
uniform float planeDisplacement;

varying vec2 vUv;

void main() {
    // PlaneBufferGeometry supplies its own normalized UVs. This is the direct
    // counterpart to the explicit `reference` attribute used by the points mode.
    vUv = uv;

    vec3 simulatedPosition = texture2D(positionTexture, uv).xyz;
    vec3 displaced = position;
    displaced.z += (simulatedPosition.z - 0.5) * planeDisplacement;
    displaced.xy += (simulatedPosition.xy - 0.5) * planeDisplacement * 0.12;

    vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
    gl_Position = projectionMatrix * mvPosition;
}
