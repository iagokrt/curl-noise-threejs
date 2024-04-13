import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// settings and animations 
import * as dat from 'dat.gui';
import gsap from 'gsap';

import '../../styles/global.scss';
javascript: (function () { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = '//mrdoob.github.io/stats.js/build/stats.min.js'; document.head.appendChild(script); })()

import vertex from '../../shader/v_shader.glsl';
import fragment from '../../shader/f_shader.glsl';

import MobileMenu from '../../component/MobileMenu';
import ModelLoader from '../../component/ModelLoader';
import CustomShader from '../../component/CustomShader';
import AddLightObjects from '../../component/addLightObjects';

import { state } from '../../state/state.js'

var DEFAULT_CAMERA = {
  fov: 10,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.001,
  far: 2000
}

export default class Particled {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.state = state;

    this.container = options.dom; // document.getElementById('webgl')
    this.menu = options.menu; // document.getelementbyid('menu')
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(this.state.renderer.setClearColor.color, this.state.renderer.setClearColor.alpha);
    // this.renderer.physicallyCorrectLights = true;

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

    this.camera.position.set(-8.6, 0.2, -6.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.addMesh();
    this.addLights();

    this.resize();
    this.render();
    this.setupResize();
    this.settings();
    // Create an instance of the MobileMenu class
    this.mobileMenuInstance = new MobileMenu();
  }

  addLights() {
    this.directionalLightPosition = new THREE.Vector3(1, 1, 1);
    this.directionalLightPosition2 = new THREE.Vector3(-1, -1, -1);
    this.directionalLightPosition3 = new THREE.Vector3(-1, 2, -1);

    const colors = {
      yellow: 0xffcc00,
      red: 0xff0000,
      green: 0x00ff00,
      blue: 0x0000ff,
      purple: 0x800080,
      cyan: 0x00ffff,
      black: 0x000000
    };

    this.directionalLight = new AddLightObjects(this.scene, colors.yellow, 0.67, this.directionalLightPosition);
    this.directionalLight2 = new AddLightObjects(this.scene, colors.purple, 0.51, this.directionalLightPosition2);
    this.directionalLight3 = new AddLightObjects(this.scene, colors.white, 0.71, this.directionalLightPosition3);

    // this.orbitalLight = new AddLightObjects(this.scene);
    // this.orbitalLight.createOrbitLight();
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
    // console.log(this.scene);
    // console.log(this.renderer);

    // Creating THREE ShaderMaterial 
    this.customShader = new CustomShader();

    // Use the ModelLoader to load the modelMesh
    this.loadedModel = new ModelLoader(this.scene);

    // this.nefertiti = this.loadedModel.scene;

    // console.log('this.nefertiti: ', this.nefertiti);

    // this.nefertiti.rotation.set(Math.PI / 2, Math.PI, 0); // Set the default rotation

    // this.nefertiti.position.x = 1.45;
    // this.nefertiti.position.y = -0.8;
    // this.nefertiti.position.z = 1.67;

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
    if (this.nefertiti) {
      this.modelRotationControls = this.gui.addFolder('Model Rotation');
      // this.modelRotationControls.add(this.nefertiti.rotation, 'x', 0, Math.PI * 2).step(0.01);
      // this.modelRotationControls.add(this.nefertiti.rotation, 'y', 0, Math.PI * 2).step(0.01);
      // this.modelRotationControls.add(this.nefertiti.rotation, 'z', 0, Math.PI * 2).step(0.01);

      this.modelPositionControls = this.gui.addFolder('Model Position');
      // this.modelPositionControls.add(this.nefertiti.position, 'x', -10, 10).step(0.01);
      // this.modelPositionControls.add(this.nefertiti.position, 'y', -10, 10).step(0.01);
      // this.modelPositionControls.add(this.nefertiti.position, 'z', -10, 10).step(0.01);

    }
    // this.modelControls.add(this.mesh.rotation, 'x', 0, Math.PI * 2).step(0.01);
    // this.modelControls.add(this.mesh.rotation, 'y', 0, Math.PI * 2).step(0.01);
    // this.modelControls.add(this.mesh.rotation, 'z', 0, Math.PI * 2).step(0.01);

    // Light controls
    this.lightControls = this.gui.addFolder('Light');
    // this.lightControls.add(this.directionalLight.position.x, 'x', -10, 10).step(0.1);

  }

  render() {
    if (!this.isPlaying) return;

    this.time += 0.05;

    // this.nefertiti.rotation.z += 0.002; // not working undefined

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);

  }
}

new Particled({
  dom: document.getElementById('webgl'),
  menu: document.getElementById('menu')
});
