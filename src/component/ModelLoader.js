// ModelLoader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

import nefertiti from '../models/nefertiti_bust.glb';

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

      console.log('shader:', this.customMaterial);

      console.log('mesh:', mesh);

      // this.modelMesh.material = this.customMaterial;

      this.scene.add(mesh);
    });
  }
}