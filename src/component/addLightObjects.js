import * as THREE from 'three';

export default class AddLightObjects {
  constructor(scene, color = 0xffffff, intensity = 1, position = new THREE.Vector3(1, 1, 1)) {
    this.scene = scene;
    this.color = color;
    this.intensity = intensity;
    this.position = position;

    this.createDirectionalLight();
  }

  createDirectionalLight() {
    const directionalLight = new THREE.DirectionalLight(this.color, this.intensity);
    directionalLight.position.copy(this.position); // Use the provided position
    this.scene.add(directionalLight);
  }

  createOrbitLight(radius = 6, speed = 0.005, color = 0xffffff, intensity = 0.0) {
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
