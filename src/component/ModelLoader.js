import nefertiti from '../models/nefertiti_bust.glb';

// ModelLoader.js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import CustomShader from './CustomShader';

export default class ModelLoader {
  constructor(scene) {
    this.scene = scene;
    this.loader = new GLTFLoader();
    this.loadModel();
  }

  loadModel() {
    const modelPath = nefertiti; // Replace with the actual path to your GLB model
    this.loader.load(modelPath, (gltf) => {
      const modelObject = gltf.scene.children[0];
      const mesh = modelObject.children[0].children[0].children[0].children[0];

      // Creating THREE ShaderMaterial 
      this.customMaterial = new CustomShader();
      // console.log('shader:', this.customMaterial);

      this.scene.add(mesh);

      mesh.position.setY(-0.85);
      mesh.position.setZ(-0.25);

      mesh.rotation.set(-Math.PI*2/4,0,Math.PI/2);

      // console.log("Model position:", mesh.position);
      // console.log("Model rotation:", mesh.rotation);

      // mesh.
    });
  }
}