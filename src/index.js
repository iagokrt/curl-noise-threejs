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
javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

import vertex from './shader/v_shader.glsl';
import fragment from './shader/f_shader.glsl';
import fragmentSimulation from './shader/fragmentSimulation.glsl';

// import tulip from '../public/tulip.glb'

const WIDTH = 64;
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
    this.renderer.setClearColor(0x0e1111, 1);
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
      1,
      window.innerWidth / window.innerHeight,
      0.001,
      1000
    );

    this.camera.position.set(0, 0, -105);
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
    this.settings();
    this.setupMenu();
    this.setupAnimations();
    // this.post();
    this.cameraMovement();
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
    this.gui.add(this.settings, 'camera', -100, 100, 1);
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
      blending: THREE.AdditiveBlending,
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
    this.geometry = new THREE.IcosahedronBufferGeometry(0.58, 79);
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

    this.time += 0.06;

    this.positionVariable.material.uniforms['time'].value = this.time;
    this.gpuCompute.compute();

    // this.bloom.strength = this.settings.bloomStrength;

    this.material.uniforms.positionTexture.value = this.gpuCompute.
    getCurrentRenderTarget(this.positionVariable).texture;
    
    this.material.uniforms.time.value = this.time;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera); // using the composer without bloom post
    // this.composer.render();
  }

  setupMenu() {
    var openState = false;
    var base = document.getElementById('base');

    this.menu.addEventListener('click', () => {
      base.classList.toggle('open');
    })

    this.container.addEventListener('click', () => {
      if (base.classList.contains('open')) {
        base.classList.toggle('open')
      } 
    })
  }

  // use gsap to animate stuff
  setupAnimations() {
    // this.gsap = gsap; // console.log(gsap);
    // mainly idea is based on the change of scene once user interactives with it
    var base = document.getElementById('base');
   
    var trigger = document.getElementById('nv1'); // first user interactive cinematics

    trigger.addEventListener('click', () => {
      // before start it closes the recent menu
      base.classList.contains('open') ? base.classList.remove('open') : ''
      var timeline = gsap.timeline({})
      // animate parallax cortina
      gsap.to('.cortina', {
        height: '100%', 
        width: '100%',
        duration: 2.5,
        ease: 'Power2.easeInOut'
      })
      // animate cam
      // console.log('initial pos', this.camera.position);
      gsap.to(this.camera.position, {
        z: -55.7,
        duration: 3.3,
      })
      
      timeline.to('#anime-container', {
        opacity: 1, display: 'flex', duration: 2, ease: 'Sine.easeIn'
      })

    })

    // ideas:
    // change the colour of the mesh
    // change the values for the shader, or time for the shader animation
  }

  // setup camera settings
  cameraMovement() {
    var camTR = document.getElementById('button2')
    camTR.addEventListener('click', () => {
      console.log(this.camera.position.z)
      this.camera.position.z = this.settings.camera
    })
  }

}

new Particled({
  dom: document.getElementById('webgl'),
  menu: document.getElementById('menu')
});
