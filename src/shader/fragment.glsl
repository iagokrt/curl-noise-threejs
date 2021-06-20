uniform float time;
uniform float progress;
uniform sampler2D t;
uniform sampler2D t1;
uniform vec4 resolution;
varying vec2 vUv;
varying vec3 vPosition;

float PI = 3.141592653589793238;

void main() {
    gl_FragColor = vec4(1.,0.,1.,0.5);
}