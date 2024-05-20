import { DirectionalLight } from "three";

const navItemsArray = [
  { text: '#1 Basic distortions', href: 'basicdistortions.html' },
  { text: '#2 Curl noise + gsap', href: 'curlnoise.html' },
  { text: '#3 Nefertiti Sculpture', href: 'sculpture.html' },
  { text: '#4 Video into Particles', href: 'videointoparticles.html' },
  { text: '#5 Triangles', href: 'triangles.html' },
  { text: 'WebGL', href: 'index.html' },
  { text: 'Contact', href: '#' }
]

const state = {
  // CANVAS: {
    renderer: {
      setClearColor: {
        color: 0x0e1111,
        alpha: 1
      }, 
    },
    scene: {
        // camera: DEFAULT_CAMERA
        // lights: 
        // lights: {  directional: new DirectionalLight() }
    },
    
  // }
}
export { state }
export { navItemsArray }
