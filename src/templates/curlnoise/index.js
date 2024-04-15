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

// import tulip from '../public/tulip.glb'
import MobileMenu from '../../component/MobileMenu';

const WIDTH = 128;

const CANVAS = {
  bgcolor: 0x0e1111,
  alpha: 1
}

const DEFAULT_CAMERA = {
  fov:10,
  aspect: window.innerWidth / window.innerHeight,
  near:0.001,
  far:2000
}

class HTMLContentGenerator {
  static generateMainContent() {
      const main = document.createElement('main');

      const header = document.createElement('header');
      header.classList.add('header');

      const logoHome = document.createElement('a');
      logoHome.href = 'index.html';
      logoHome.classList.add('logo');
      logoHome.title = 'Navigate back to homepage';
      logoHome.textContent = 'WebGL ';

      const breadcrumbSeparator = document.createElement('span');
      breadcrumbSeparator.classList.add('breadcrumb-separator');
      breadcrumbSeparator.textContent = '›';

      const logoItem = document.createElement('a');
      logoItem.href = '#';
      logoItem.classList.add('logo', 'logo-item');
      logoItem.textContent = ' Curl Noise Distortions';

      header.appendChild(logoHome);
      header.appendChild(breadcrumbSeparator);
      header.appendChild(logoItem);

      const webglDiv = document.createElement('div');
      webglDiv.id = 'webgl';

      main.appendChild(header);
      main.appendChild(webglDiv);

      return main;
  }

  static generateLoadingContent() {
      const aside = document.createElement('aside');
      aside.id = 'loading';

      const h1 = document.createElement('h1');
      h1.textContent = 'Loading...';

      aside.appendChild(h1);

      return aside;
  }
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
    // initialize the GPUComputationRenderer
    this.initGPGPU();
    this.addMesh();

    this.resize();
    this.render();
    this.setupResize();
    this.settings();
    this.setupAnimations();
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
      let zz = (i%WIDTH)/WIDTH;

      positions.set([x,y,z], i*3);
      reference.set([xx,yy], i*2);
    }

    // setting attributes to buffer
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('reference', new THREE.BufferAttribute(reference, 2))

    // instantiate the object
    // this.geometry = this.model.geometry; // alternatively loading the model
    this.geometry = new THREE.TorusGeometry(5, 32, 162, 50);
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

    this.time += 0.09;

    this.positionVariable.material.uniforms['time'].value = this.time;
    this.gpuCompute.compute();

    // this.bloom.strength = this.settings.bloomStrength;

    this.material.uniforms.positionTexture.value = this.gpuCompute.
    getCurrentRenderTarget(this.positionVariable).texture;
    
    this.material.uniforms.time.value = this.time;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera); // using the composer without bloom post
  }

  // use gsap to animate stuff
  setupAnimations() {
    const animationDuration = 2;
    const restartDelay = 5;

    setTimeout(() => {
  
      const timeline = gsap.timeline({});
    
      // Animate parallax cortina
      gsap.to('.cortina', {
        width: '0%',
        duration: 3.7,
        ease: 'Sine.easeInOut'
      });
  
      // console.log('cortina with Power2.easeInOut');
  
      // Animate camera position
      gsap.to(this.camera.position, {
        z: -25.7, // cam step 1
        duration: 4.2 // cam step 1 duration
      })
   
  
      // Animate mesh rotation
      gsap.to(this.mesh.rotation, {
        x: Math.PI,
        // y: Math.PI,
        z: Math.PI,
        delay: 3,
        duration: 6,
        ease: 'Sine.easeIn'
      })
      .then(() => {
        gsap.to(this.camera.position, {
          z: -900, // cam step 2
          duration: 1.4, // cam step 2 duration
          delay: 5.4 // delay is bigger then duration for step 1
        })
      });
      // .then(() => {
      //   gsap.to(this.mesh.rotation, {
      //     x: Math.PI,
      //     y: Math.PI,
      //     z: Math.PI,
      //     delay: 2.5,
      //     duration: 4,
      //     ease: 'Sine.easeOut'
          
      //   })
      // })
  
    }, 2500); 
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const mainContent = HTMLContentGenerator.generateMainContent();
  const loadingContent = HTMLContentGenerator.generateLoadingContent();

  document.body.appendChild(mainContent);
  document.body.appendChild(loadingContent);

  new Particled({
    dom: document.getElementById('webgl'),
    menu: document.getElementById('menu')
  });
});
