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

class HTMLContentGenerator {
  static generateMainContent() {
      const main = document.createElement('main');

      const header = document.createElement('header');

      const headerInner = document.createElement('header');
      headerInner.classList.add('header');

      const logo = document.createElement('a');
      logo.href = '#';
      logo.classList.add('logo');
      logo.textContent = 'Nefertiti: Exploring Lights and Shadows';

      const inputCheckbox = document.createElement('input');
      inputCheckbox.type = 'checkbox';
      inputCheckbox.id = 'check';

      const labelIcons = document.createElement('label');
      labelIcons.htmlFor = 'check';
      labelIcons.classList.add('icons');

      const menuIcon = document.createElement('i');
      menuIcon.classList.add('bx', 'bx-menu');
      menuIcon.id = 'menu-icon';

      const closeIcon = document.createElement('i');
      closeIcon.classList.add('bx', 'bx-x');
      closeIcon.id = 'close-icon';

      labelIcons.appendChild(menuIcon);
      labelIcons.appendChild(closeIcon);

      const desktopMenu = document.createElement('nav');
      desktopMenu.classList.add('navbar', 'desktop-menu');

      const navItemsDesktop = [
          { text: 'Start', href: '#start', class: 'start' },
          { text: 'About this Experiment', href: '#about' },
          { text: 'Credits', href: '#credits' }
      ];

      navItemsDesktop.forEach(item => {
          const navItem = document.createElement('a');
          navItem.href = item.href;
          navItem.classList.add('nav-item');
          if (item.class) {
            navItem.classList.add(item.class);
          }
          navItem.classList.add('nav-item');
          navItem.textContent = item.text;
          desktopMenu.appendChild(navItem);
      });

      const navIcon = document.createElement('span');
      navIcon.classList.add('nav-icon');

      const navIconLink = document.createElement('a');
      navIconLink.href = '#';
      navIconLink.id = 'nav-icon';
      navIconLink.classList.add('nav-item');
      navIconLink.textContent = '☰';

      navIcon.appendChild(navIconLink);

      const mobileMenu = document.createElement('nav');
      mobileMenu.classList.add('mobile-menu');

      const wrapper = document.createElement('div');
      wrapper.classList.add('wrapper');

      const navItemsMobile = [
          { text: 'Start', href: '#start' },
          { text: 'About this Experiment', href: '#about' },
          { text: 'Credits', href: '#credits' }
      ];

      navItemsMobile.forEach(item => {
          const navItem = document.createElement('a');
          navItem.href = item.href;
          navItem.classList.add('nav-item');
          // navItem.style.cssText = item.style;
          navItem.textContent = item.text;
          wrapper.appendChild(navItem);
      });

      mobileMenu.appendChild(wrapper);

      headerInner.appendChild(logo);
      headerInner.appendChild(inputCheckbox);
      headerInner.appendChild(labelIcons);
      headerInner.appendChild(desktopMenu);
      headerInner.appendChild(navIcon);
      headerInner.appendChild(mobileMenu);

      header.appendChild(headerInner);

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
class MenuHandler {
  constructor() {
      this.startItem = document.querySelector('.start'); // Seleciona o item com a classe 'start'
      this.startItem.addEventListener('click', this.handleStartClick.bind(this)); // Adiciona um event listener para o clique no item 'start'
  }

  handleStartClick(event) {
      event.preventDefault(); // Evita o comportamento padrão do link

      console.log("Item 'start' clicado!");

      this.headerElement = document.querySelector('.header');
      this.navbarElement = document.querySelector('.navbar');

      // Adiciona as classes de animações
      this.headerElement.classList.add('collapsed');
      this.navbarElement.classList.add('hidden');
  }
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
    this.renderer.setClearColor(0x01080B, this.state.renderer.setClearColor.alpha);
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

    this.camera.position.set(10.5, 3.2, -2);

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
    // Criar uma promessa para aguardar o carregamento do modelo
    const modelLoadedPromise = new Promise((resolve, reject) => {
        this.loadedModel = new ModelLoader(this.scene);
        // this.loadedModel.onLoad(() => {
        //     resolve();
        // });
    });

    // Quando a promessa for resolvida (ou seja, o modelo estiver completamente carregado)
    // modelLoadedPromise.then(() => {
    //     // Agora você pode acessar as propriedades de posição e rotação do modelo
    //     console.log("Model position:", this.loadedModel.mesh.position);
    //     console.log("Model rotation:", this.loadedModel.mesh.rotation);
    // });

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

  // setting module
  settings() {
    let that = this;

    this.gui = new dat.GUI();
    this.gui.close();
    // Camera controls
    this.cameraControls = this.gui.addFolder('Camera');
    this.cameraControls.add(this.camera.position, 'x', -20, 20).step(0.05);
    this.cameraControls.add(this.camera.position, 'y', -20, 20).step(0.05);
    this.cameraControls.add(this.camera.position, 'z', -20, 20).step(0.05);

    // Light controls
    this.lightControls = this.gui.addFolder('Light');
    // this.lightControls.add(this.directionalLight.position.x, 'x', -10, 10).step(0.1);

  }

  render() {
    if (!this.isPlaying) return;

    this.time += 0.05;

    // this.loadedModel.rotation += 0.02; // not working undefined
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);

  }
}

document.addEventListener('DOMContentLoaded', () => {
  const mainContent = HTMLContentGenerator.generateMainContent();
  const loadingContent = HTMLContentGenerator.generateLoadingContent();

  document.body.appendChild(mainContent);
  document.body.appendChild(loadingContent);

  new MenuHandler();

  new Particled({
    dom: document.getElementById('webgl'),
    menu: document.getElementById('menu')
  });

  var tt= document.querySelector('.start');

  tt.click();
  // console.log(tt)
});
