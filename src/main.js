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

import './styles/global.scss';
// javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

import vertex from './shader/v_shader.glsl';
import fragment from './shader/f_shader.glsl';
import fragmentSimulation from './shader/fragmentSimulation.glsl';

// import tulip from '../public/tulip.glb'

import MobileMenu from './component/MobileMenu';

const WIDTH = 128;

const CANVAS = {
  bgcolor: 0x0e1111,
  alpha: 1
}

const DEFAULT_CAMERA = {
  fov: 10,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.001,
  far: 2000
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
    // this.loader = new GLTFLoader();

    // load 'manager'
    this.loading = true;

    window.onload = () => {
      document.getElementById("loading").style.display = "none"
      document.querySelector("header").style.display = "block"
      // document.querySelector("anime-container").style.display = "flex" 
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

    // this.loader.load(tulip, (gltf)=>{
    // console.log(gltf.scene.children[0]);
    // });

    this.isPlaying = true;
    this.addMesh();
    this.addPlane();

    this.resize();
    this.render();
    this.setupResize();
    this.settings();

    // Create an instance of the MobileMenu class
    this.mobileMenuInstance = new MobileMenu();
  }

  // post processing effects
  post() {
    this.rr = new RenderPass(this.scene, this.camera);

    /* configure post-processing */

    // bloom
    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );

    this.bloom.threshold = this.settings.bloomThreshold;
    this.bloom.strength = this.settings.bloomStrength;
    this.bloom.radius = this.settings.bloomRadius;

    // render composer 
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.rr);
    this.composer.addPass(this.bloom);
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
    // this.shaderFolder.add(this.settings);
    // shadersSettings.add(cube.rotation, 'y', 0, Math.PI * 2)

    this.gui.add(this.settings, 'distortion', 0, 3, 0.01);
    this.gui.add(this.settings, 'bloomStrength', 0, 5, 0.01);
    this.gui.add(this.settings, 'camera', -200, 100, 1);
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

    this.material = new THREE.MeshNormalMaterial();
    this.geometry = new THREE.TorusGeometry(5, 32, 162, 50);
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    this.scene.add(this.mesh);
    // console.log(this.mesh);
  }

  addPlane() {
    // THREE ShaderMaterial is using glsl vertex and fragment
    this.material2 = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives :enable',
      },
      uniforms: {
        time: { type: 'f', value: 0 },
        positionTexture: { value: null },
        resolution: { type: 'v4', value: new THREE.Vector4() },
      },
      blending: THREE.AdditiveBlending,
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.geometry2 = new THREE.IcosahedronGeometry(120, 20);

    // this.material2 = new THREE.MeshBasicMaterial();

    // this.geometry = this.model.geometry; // alternatively loading the model
    this.plane = new THREE.Mesh(this.geometry2, this.material2);

    this.plane.visible = false;

    // this.plane.position.z = 200;
    // this.plane.position.x = 20;

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

    // this.positionVariable.material.uniforms['time'].value = this.time;
    // this.gpuCompute.compute();

    // this.bloom.strength = this.settings.bloomStrength;

    // this.material.uniforms.positionTexture.value = this.gpuCompute.
    // getCurrentRenderTarget(this.positionVariable).texture;

    // this.material.uniforms.time.value = this.time;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera); // using the composer without bloom post
    // this.composer.render();
  }
}

new Particled({
  dom: document.getElementById('webgl'),
  menu: document.getElementById('menu')
});
