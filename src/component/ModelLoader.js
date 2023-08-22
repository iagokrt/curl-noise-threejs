// ModelLoader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import nefertiti from '../models/nefertiti_bust.glb';

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
      const modelMesh = modelObject.children[0].children[0].children[0].children[0];

      // Optionally, you can perform operations on the loaded model
      // before adding it to the scene
      // this.modelMesh.rotation
      this.scene.add(modelMesh);
    });
  }
}