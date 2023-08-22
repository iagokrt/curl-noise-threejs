import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// settings and animations 
import * as dat from 'dat.gui';
import gsap from 'gsap';

import '../../styles/global.scss';
javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

import vertex from '../../shader/v_shader.glsl';
import fragment from '../../shader/f_shader.glsl';

import MobileMenu from '../../component/MobileMenu';
import ModelLoader from '../../component/ModelLoader';
import CustomShader from '../../component/CustomShader';

import { state } from '../../state/state.js'

var DEFAULT_CAMERA = {
  fov:10,
  aspect: window.innerWidth / window.innerHeight,
  near:0.001,
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
    this.renderer.setClearColor(state.renderer.setClearColor.color, state.renderer.setClearColor.alpha);
    this.renderer.physicallyCorrectLights = true;

    this.container.appendChild(this.renderer.domElement);
    // this.loader = new GLTFLoader();
    
    // load 'manager'
    this.loading = true;

    window.onload = () => { 
      document.getElementById("loading").style.display = "none" 
      document.querySelector("header").style.display = "block" 
      // document.querySelector("anime-container").style.display = "flex" 
      this.loading = false;
    }

    /**
     * camera and  controls
    */
    this.camera = new THREE.PerspectiveCamera(
      DEFAULT_CAMERA.fov,
      DEFAULT_CAMERA.aspect,
      DEFAULT_CAMERA.near,
      DEFAULT_CAMERA.far
    );

    this.camera.position.set(0, 0, -10);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;
    
    this.isPlaying = true;

    this.addMesh();

    this.resize();
    this.render();
    this.setupResize();
    this.settings();
    // Create an instance of the MobileMenu class
    this.mobileMenuInstance = new MobileMenu();
  }

  // setting modules 
  settings() {
    let that = this;

    this.gui = new dat.GUI();
    // Camera controls
    this.cameraControls = this.gui.addFolder('Camera');
    this.cameraControls.add(this.camera.position, 'x', -10, 10).step(0.1);
    this.cameraControls.add(this.camera.position, 'y', -10, 10).step(0.1);
    this.cameraControls.add(this.camera.position, 'z', -10, 10).step(0.1);

    // Model controls
    this.modelControls = this.gui.addFolder('Model');
    // this.modelControls.add(this.mesh.rotation, 'x', 0, Math.PI * 2).step(0.01);
    // this.modelControls.add(this.mesh.rotation, 'y', 0, Math.PI * 2).step(0.01);
    // this.modelControls.add(this.mesh.rotation, 'z', 0, Math.PI * 2).step(0.01);

    // Light controls
    // const lightControls = gui.addFolder('Light');
    // lightControls.add(directionalLight.position, 'x', -10, 10).step(0.1);

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

  addMesh() {
    let that = this;

    // Creating THREE ShaderMaterial 
    this.customShader = new CustomShader();

    // console.log(this.scene);
    this.loadedModel = new ModelLoader(this.scene); // Use the ModelLoader to load the modelMesh
    // console.log(this.loadedModel);
    console.log(this.loadedModel.scene.children); // mesh?

    this.testing = this.loadedModel.scene.children;

    // console.log(this.scene);
    // console.log(this.renderer);

    // this.mesh.material = this.customShader.material;
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

    // this.testing.rotation.x += 0.01; // not working undefined

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);

  }
}

new Particled({
  dom: document.getElementById('webgl'),
  menu: document.getElementById('menu')
});
