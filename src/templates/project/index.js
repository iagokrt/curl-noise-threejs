import * as THREE from 'three';
import * as dat from 'dat.gui';
import gsap from 'gsap';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// javascript:(function(){var script=document.createElement('script');script.onload=function(){var stats=new Stats();document.body.appendChild(stats.dom);requestAnimationFrame(function loop(){stats.update();requestAnimationFrame(loop)});};script.src='//mrdoob.github.io/stats.js/build/stats.min.js';document.head.appendChild(script);})()

import '../../styles/global.scss';
// import tulip from '../public/tulip.glb'

const state = {
    scene: {
        canvas: {
            renderer: {
                setClearColor: {
                    color: 0x0e1111,
                    alpha: 1
                }
            },
            objects: [
                {
                    camera: new THREE.PerspectiveCamera(10, window.innerWidth / window.innerHeight, 0.001, 2000)
                }
            ]
        } 
    }
}

export default class Project {
  constructor(options) {
    const { color, alpha } = state.scene.canvas.renderer.setClearColor;
    const { camera } = state.scene.canvas.objects[0];

    this.scene = new THREE.Scene();

    this.container = options.dom; // document.getElementById('webgl')
    this.menu = options.menu; // document.getElementById('menu')
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(color, alpha);
    // this.renderer.physicallyCorrectLights = true;

    this.container.appendChild(this.renderer.domElement);
    // this.loader = new GLTFLoader();
    
    // load
    this.loading = true;

    window.onload = () => { 
      document.getElementById("loading").style.display = "none" 
      document.querySelector("header").style.display = "block" 
      this.loading = false;
    }

    this.camera = camera;

    this.camera.position.set(0, 0, -885);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    // this.loader.load(tulip, (gltf)=>{
      // console.log(gltf.scene.children[0]);
    // });
    
    this.isPlaying = true;
    this.addPlane();

    this.resize();
    this.render();
    this.setupResize();
    this.settings();
    this.setupMenu();
    this.setupAnimations();
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

  addPlane() {
    this.material = new THREE.MeshNormalMaterial({side:THREE.DoubleSide});

    this.geometry = new THREE.PlaneGeometry(120, 20,20);
    this.plane = new THREE.Mesh(this.geometry, this.material);
    this.plane.visible = false;
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
    this.renderer.render(this.scene, this.camera);
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
    const base = document.getElementById('base');
    const trigger = document.getElementById('nv1');
    const animationDuration = 2;
    const restartDelay = 5;
  
    trigger.addEventListener('click', () => {
      base.classList.contains('open') ? base.classList.remove('open') : '';
      // console.log('init', this.time);
  
      const timeline = gsap.timeline({});
  
      // Animate parallax cortina
      gsap.to('.cortina', {
        width: '0%',
        duration: 2.5,
        ease: 'Power2.easeInOut'
      });
  
      console.log('cortina lasts for 2.5 with Power2.easeInOut');
    });
  }

}

new Project({
  dom: document.getElementById('webgl'),
  menu: document.getElementById('menu')
});
