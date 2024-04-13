import * as THREE from 'three';

import vertexShader from '../shader/vertex.glsl';
import fragmentShader from '../shader/fragment.glsl';

export default class CustomMaterial {
  constructor() {
    this.defineMaterial();
  }

  defineMaterial() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives :enable',
      },
      uniforms: {
        time: { type: 'f', value: 0 },
        positionTexture: { value: null },
        resolution: { type: 'v4', value: new THREE.Vector4() },
      },
      blending: THREE.AdditiveBlending,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
  }

  updateUniforms(time, positionTexture, resolution) {
    this.material.uniforms.time.value = time;
    this.material.uniforms.positionTexture.value = positionTexture;
    this.material.uniforms.resolution.value = resolution;
  }
}