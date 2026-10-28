import { DirectionalLight } from "three";

const navItemsArray = [
  { text: '#1 RGB Shift', href: 'rgbshift.html' },
  { text: '#2 Curl noise + gsap', href: 'curlnoise.html' },
  { text: '#3 Nefertiti Sculpture', href: 'sculpture.html' },
  { text: '#4 Video into Particles', href: 'videointoparticles.html' },
  { text: '#5 Triangles', href: 'triangles.html' },
  { text: '#6 Stippling Technique - Dali', href: 'stippling.html' },
  { text: '#7 Using noise and Points', href: 'noiseandpoints.html' },
  { text: '#8 FBO Particles decompilation', href: 'basicdistortions.html' },
  { text: 'GitHub', href: 'https://github.com/iagokrt/', external: true },
  { text: 'Contact (LinkedIn)', href: 'https://www.linkedin.com/in/iagobarreto/', external: true }
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
