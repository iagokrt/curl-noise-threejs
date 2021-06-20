import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

// post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

import * as dat from 'dat.gui';
import gsap from 'gsap';

import './styles/global.scss';

import vertex from './shader/ParticlesVertex.glsl';
import fragment from './shader/fragment.glsl';
import fragmentSimulation from './shader/fragmentSimulation.glsl';

const WIDTH = 32;

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

    this.camera = new THREE.PerspectiveCamera(
      1,
      window.innerWidth / window.innerHeight,
      0.001,
      2500
    );

    this.camera.position.set(0, 0, 50);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

      /** TA TIRANDO INIT GPPUG */
    this.initGPGPU();

    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.settings();
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

  fillPixels(texture) {
    // console.log(texture);
    let arr = texture.image.data;
    for(let i = 0; i < arr.length; i=i+4) {
      // const pixel = arr[i];
      let x = Math.random();
      let y = Math.random();
      let z = Math.random();

      arr[i] = x;
      arr[i+1] = y;
      arr[i+2] = z;
      arr[i+3] = 1; // w

    }
    console.log(arr);
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

  addObjects() {
    let that = this;

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
    
    let positions = new Float32Array(WIDTH*WIDTH*3);
    let reference = new Float32Array(WIDTH*WIDTH*2);

    for(let i = 0; i < WIDTH*WIDTH; i++) {
      console.log(i);
      let x = Math.random();
      let y = Math.random();
      let z = Math.random();

      let xx = (i%WIDTH)/WIDTH;
      let yy = ~~(i/WIDTH)/WIDTH;
      // let zz = (i%WIDTH)/WIDTH;

      positions.set([x,y,z], i*3);
      reference.set([xx,yy], i*2);
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('reference', new THREE.BufferAttribute(reference, 2))

    this.plane = new THREE.Points(this.geometry, this.material);

    this.scene.add(this.plane);
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
