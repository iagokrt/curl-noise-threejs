import * as THREE from 'three';

export default class AddLightObjects {
  constructor(scene) {
    this.scene = scene;
    this.lights = [];
  }

  createDirectionalLight(color = 0xffffff, intensity = 1, position = new THREE.Vector3(1, 1, 1)) {
    this.lights = [];
    const directionalLight = new THREE.DirectionalLight(color, intensity);
    directionalLight.position.copy(position); // Use the provided position
    this.scene.add(directionalLight);
    this.lights.push(directionalLight);
  }

  createOrbitLight(radius = 6, speed = 1, color = 0xff0000, intensity = 0.8) {
    const orbitLight = new THREE.PointLight(color, intensity);
    orbitLight.userData.radius = radius;
    orbitLight.userData.speed = speed;
    
    this.scene.add(orbitLight);
    
    this.updateOrbitLight(orbitLight, 0);
  }

  updateOrbitLight(light, time) {
    const angle = time * light.userData.speed;
    // const x = light.userData.radius * Math.cos(angle);
    const y = light.userData.radius * Math.sin(angle);
    
    light.position.set( y, light.position.z);
  }
}
