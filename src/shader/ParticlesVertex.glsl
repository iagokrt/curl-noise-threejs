uniform float time;
varying vec2 vUv;
varying vec3 vPosition;
uniform sampler2D positionTexture;
attribute vec2 reference;
float PI = 3.141592653589793238;
void main() {
    vUv = reference;

    vec3 pos = texture(positionTexture, reference).xyz;

    vec4 mvPosition = modelViewMatrix * vec4( pos, 1. );

    gl_PointSize = 300. * ( 1. / - mvPosition.z );
    gl_Position = projectionMatrix * mvPosition;
}
