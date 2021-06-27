import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// post-processing
// import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
// import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

import * as dat from 'dat.gui';
import gsap from 'gsap';

import './styles/global.scss';

import vertex from './shader/v_shader.glsl';
// import fragment from './shader/f_shader.glsl';
// import vertex from './shader/vertexParticles.glsl';
import fragment from './shader/fragment.glsl';
import fragmentSimulation from './shader/fragmentSimulation.glsl';

// import tulip from '../public/tulip.glb'

const WIDTH = 128;

export default class Particled {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom; // document.getElementById('webgl')
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xf1f1f1, 1);
    this.renderer.physicallyCorrectLights = true;

    this.container.appendChild(this.renderer.domElement);
    // this.loader = new GLTFLoader();

    this.camera = new THREE.PerspectiveCamera(
      1,
      window.innerWidth / window.innerHeight,
      0.001,
      2500
    );

    this.camera.position.set(0, 0, -95);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    // this.loader.load(tulip, (gltf)=>{
      // console.log(gltf.scene.children[0]);
    // });
    
    this.isPlaying = true;
    // initialize the GPUComputationRenderer
    this.initGPGPU();
    this.addMesh();
    this.resize();
    this.render();
    this.setupResize();
    // this.settings();

  }
  
  // framebuffer output technique
  initGPGPU() {
    this.gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, this.renderer);

    this.dtPosition = this.gpuCompute.createTexture();
    this.fillPixels(this.dtPosition);

    this.positionVariable = this.gpuCompute.addVariable('texturePosition', fragmentSimulation, this.dtPosition);

    this.positionVariable.material.uniforms['time'] = { value: 0 };

    this.positionVariable.wrapS = THREE.RepeatWrapping;
    this.positionVariable.wrapT = THREE.RepeatWrapping;

    this.gpuCompute.init();

  }

  // fill the positions on the gpgpu rendering
  fillPixels(texture) {
    // console.log(texture);
    let arr = texture.image.data;
    for(let i = 0; i < arr.length; i=i+4) {
      // const pixel = arr[i];
      let x = Math.random();
      let y = Math.random();
      let z = Math.random();

      // creating the positions
      arr[i] = x;
      arr[i+1] = y;
      arr[i+2] = z;
      arr[i+3] = 1; // w

    }
    // console.log(arr);
  }

  settings() {
    let that = this;

    this.gui = new dat.GUI();
  
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;

    this.camera.updateProjectionMatrix();
  }

  addMesh() {
    let that = this;

    // THREE ShaderMaterial is using glsl vertex and fragment && declaring uniforms 
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives :enable',
      },
      uniforms: {
        time: { type: 'f', value: 0 },
        positionTexture: {  value: null },
        resolution: { type: 'v4', value: new THREE.Vector4() },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry = new THREE.BufferGeometry();
    
    // using the buffer to create particles
    let positions = new Float32Array(WIDTH*WIDTH*3);
    let reference = new Float32Array(WIDTH*WIDTH*2);

    for(let i = 0; i < WIDTH*WIDTH; i++) {
      // console.log(i);
      let x = Math.random();
      let y = Math.random();
      let z = Math.random();

      let xx = (i%WIDTH)/WIDTH;
      let yy = ~~(i/WIDTH)/WIDTH;
      // let zz = (i%WIDTH)/WIDTH;

      positions.set([x,y,z], i*3);
      reference.set([xx,yy], i*2);
    }

    // setting attributes to buffer
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('reference', new THREE.BufferAttribute(reference, 2))

    // instantiate the object
    // this.geometry = this.model.geometry; // alternatively loading the model
    this.geometry = new THREE.IcosahedronBufferGeometry(1., 16);
    this.mesh = new THREE.Points(this.geometry, this.material);

    this.scene.add(this.mesh);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render();
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;

    this.time += 0.05;

    this.positionVariable.material.uniforms['time'].value = this.time;
    this.gpuCompute.compute();

    this.material.uniforms.positionTexture.value = this.gpuCompute.
    getCurrentRenderTarget(this.positionVariable).texture;
    
    this.material.uniforms.time.value = this.time;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera); // using the composer without bloom post
  }
}

new Particled({
  dom: document.getElementById('webgl'),
});
