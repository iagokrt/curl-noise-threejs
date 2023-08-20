import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// post-processing
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// gpu rendering
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

// settings and animations 
import * as dat from 'dat.gui';
import gsap from 'gsap';

import '../../styles/global.scss';
// javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

import vertex from '../../shader/v_shader.glsl';
import fragment from '../../shader/f_shader.glsl';
import fragmentSimulation from '../../shader/fragmentSimulation.glsl';

import MobileMenu from '../../component/MobileMenu';

const CANVAS = {
  bgcolor: 0x0e1111,
  alpha: 1
}

const DEFAULT_CAMERA = {
  fov:10,
  aspect: window.innerWidth / window.innerHeight,
  near:0.01,
  far:2000
}
export default class Particled {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom; // document.getElementById('webgl')
    this.menu = options.menu; // document.getelementbyid('menu')
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(CANVAS.bgcolor, CANVAS.alpha);
    this.renderer.physicallyCorrectLights = true;

    this.container.appendChild(this.renderer.domElement);
    
    this.loading = true;

    window.onload = () => { 
      document.getElementById("loading").style.display = "none" 
      document.querySelector("header").style.display = "block" 
      this.loading = false;
    }

    this.camera = new THREE.PerspectiveCamera(
      DEFAULT_CAMERA.fov,
      DEFAULT_CAMERA.aspect,
      DEFAULT_CAMERA.near,
      DEFAULT_CAMERA.far
    );

    this.camera.position.set(0, 0, -885);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;
    
    this.isPlaying = true;
    this.addPlane();

    this.resize();
    this.render();
    this.setupResize();
    this.settings();

    // Create an instance of the MobileMenu class
    this.mobileMenuInstance = new MobileMenu();
  }
  
  settings() {
    let that = this;

    this.gui = new dat.GUI();
    
    this.gui.close();

    this.settings = {
      distortion: 0.0,
      bloomStrength: .01,
      camera: 0,
      fragColor_vUvChannels: 0.4
    };

    this.shaderFolder = this.gui.addFolder('shaders')
    
    this.gui.add(this.settings, 'distortion', 0, 3, 0.01);
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
    // this.composer.setSize(this.width, this.height);
  }

  addPlane() {
    this.material = new THREE.PointsMaterial();
    this.geometry = new THREE.IcosahedronGeometry(120, 20);

    this.plane = new THREE.Points(this.geometry, this.material);

    // this.plane.visible = false;

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

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera); // using the composer without bloom post
  }
}

new Particled({
  dom: document.getElementById('webgl'),
  menu: document.getElementById('menu')
});
