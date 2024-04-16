import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// settings and animations 
import * as dat from 'dat.gui';
import gsap from 'gsap';

import '../../styles/global.scss';
// javascript: (function () { var script = document.createElement('script'); script.onload = function () { var stats = new Stats(); document.body.appendChild(stats.dom); requestAnimationFrame(function loop() { stats.update(); requestAnimationFrame(loop) }); }; script.src = '//mrdoob.github.io/stats.js/build/stats.min.js'; document.head.appendChild(script); })()

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

      // aside display
      const headerAside = document.createElement('aside');
      headerAside.classList.add('logoTitle');

      const logo = document.createElement('a');
      logo.href = '#';
      logo.classList.add('logo');
      logo.textContent = 'Nefertiti: Exploring Lights and Shadows';

      const logoBackButton = document.createElement('a');
      logoBackButton.href = '/index.html';
      logoBackButton.classList.add('logoBackButton');
      logoBackButton.textContent = '‹ back to homepage';

      const desktopMenu = document.createElement('nav');
      desktopMenu.classList.add('navbar', 'desktop-menu');

      const navItemsDesktop = [
          { text: '⦿ Start', href: '#start', class: 'start', info: 'start' },
          { text: '⦿ About this Experiment', href: '#about', class: 'about', info: 'lorem ipsum descriptior propt from thein yogurt' },
          { text: '⦿ Credits', href: '#credits', class: 'credits', info: 'credits to yuri artiuk lesson on sculpture to particles, and also the model creator' }
      ];

      navItemsDesktop.forEach(item => {
        const navItem = document.createElement('a');
        navItem.href = item.href;
        navItem.classList.add('nav-item');
    
        if (item.class) {
          navItem.classList.add(item.class);
        }

        navItem.textContent = item.text;

        if (item.class == 'about') {
          const navItemDescription = document.createElement('aside');
          navItemDescription.classList.add('info', 'hidden');
          navItemDescription.textContent = item.info;
          navItem.appendChild(navItemDescription); // Adicionando o <aside> como filho do <a>
        } 

        if (item.class == 'credits') {
          const navItemDescription = document.createElement('aside');
          navItemDescription.classList.add('info', 'hidden');
          navItemDescription.textContent = item.info;
          navItem.appendChild(navItemDescription); // Adicionando o <aside> como filho do <a>
        } 
    
        desktopMenu.appendChild(navItem);
      });
   
      headerAside.appendChild(logo);
      headerAside.appendChild(logoBackButton);
      headerInner.appendChild(headerAside);
      headerInner.appendChild(desktopMenu);

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

      this.aboutItem = document.querySelector('.about');
      this.aboutItem.addEventListener('click', this.handleAboutClick.bind(this));
      
      this.creditItem = document.querySelector('.credits');
      this.creditItem.addEventListener('click', this.handleCreditClick.bind(this));
  }

  handleStartClick(event) {
      event.preventDefault(); // Evita o comportamento padrão do link

      console.log("Item 'start' clicado!");

      this.headerElement = document.querySelector('.header');
      this.navbarElement = document.querySelector('.navbar');
      this.navbarElement_start = document.querySelector('.navbar .start');

      // Adiciona as classes de animações
      this.headerElement.classList.add('collapsed');
      // this.navbarElement.classList.add('hidden');
      this.navbarElement_start.classList.add('hidden');

  }

  handleAboutClick(event) {
    event.preventDefault();
    this.aboutInfo = document.querySelector('.about .info');
    this.aboutInfo.classList.toggle('hidden');
  }

  handleCreditClick(event) {
    event.preventDefault();
    this.creditInfo = document.querySelector('.credits .info');
    this.creditInfo.classList.toggle('hidden');
  }

}

export default class Particled {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.state = state;

    this.debug = true;

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
     * camera, controls, lights
    */
    this.camera = new THREE.PerspectiveCamera(
      DEFAULT_CAMERA.fov,
      DEFAULT_CAMERA.aspect,
      DEFAULT_CAMERA.near,
      DEFAULT_CAMERA.far
    );

    this.camera.position.set(10.5, 3.2, -2);

    this.enableLight = 'tt';

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.settings();

    this.addMesh();
    this.addLights();

    this.resize();
    this.render();
    this.setupResize();
    // Create an instance of the MobileMenu class
    // this.mobileMenuInstance = new MobileMenu();
  }

  addLights() {
    // Remove as luzes anteriores, se houver
    this.removeLights();

    // posição das fontes direcionais de luz 
    this.directionalLightPosition = new THREE.Vector3(1, 1, 1);
    this.directionalLightPosition2 = new THREE.Vector3(-1, -1, -1);
    this.directionalLightPosition3 = new THREE.Vector3(1, -2, 1);

    // adiciona a luz orbital
    // this.orbitalLight = new AddLightObjects(this.scene);
    // this.orbitalLight.createOrbitLight();

    const colors = {
      yellow: 0xffcc00,
      red: 0xff0000,
      green: 0x00ff00,
      blue: 0x0000ff,
      purple: 0x800080,
      cyan: 0x00ffff,
      black: 0x000000,
      
    };

    // Verifica se a luz está habilitada
    if (this.enableLight && this.enableLight.enable) {
      // Adiciona a luz selecionada com base na opção escolhida
      // console.log('this.selectedLight',this.selectedLight)
      console.log('this.selectedLight.light:',this.selectedLight.light)

      const lightObjects = new AddLightObjects(this.scene);

      switch(this.selectedLight.light) {
        case 'directionalLight 1':
          console.log('directionalLight')
          this.directionalLight = lightObjects.createDirectionalLight(colors.blue, 0.62, this.directionalLightPosition);
          break;
        case 'directionalLight 2':
          this.directionalLight2 = lightObjects.createDirectionalLight(colors.purple, 0.51, this.directionalLightPosition2);
          break;
        case 'directionalLight 3':
          this.directionalLight3 = lightObjects.createDirectionalLight(colors.white, 0.71, this.directionalLightPosition3);
          break;
        default:
          console.log('not found')
          break;
      }
    }

    if (this.debug) {
      var count=0;
      this.scene.traverse((object) => {
        if (object instanceof THREE.Light) {
          console.log(object);
          count++
        }
      });
      console.log('Lights found:', count)
    }
    
  }

  // Método para remover todas as luzes da cena
  removeLights() {
    // Remova todas as luzes anteriores, se houver
    if (this.directionalLight) {
      this.scene.remove(this.directionalLight);
      this.directionalLight = null;
    }
    if (this.directionalLight2) {
      this.scene.remove(this.directionalLight2);
      this.directionalLight2 = null;
    }
    if (this.directionalLight3) {
      this.scene.remove(this.directionalLight3);
      this.directionalLight3 = null;
    }
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

    if (!this.debug) {
      this.gui.close();
    }

    // Camera controls
    this.cameraControls = this.gui.addFolder('Camera');
    this.cameraControls.add(this.camera.position, 'x', -20, 20).step(0.05);
    this.cameraControls.add(this.camera.position, 'y', -20, 20).step(0.05);
    this.cameraControls.add(this.camera.position, 'z', -20, 20).step(0.05);

    // Light controls
    this.lightControls = this.gui.addFolder('Lights');
    this.lightControls_directionalLight = this.lightControls.addFolder('directionalLight');
    // this.lightControls_ambientLight = this.lightControls.addFolder('ambientLight');

    // Opções de tipos de luz
    // const lightOptions = ['Ambient Light', 'Directional Light', 'Point Light', 'Spot Light'];
    this.lightOptions = ['directionalLight 1', 'directionalLight 2', 'directionalLight 3'];
    this.selectedLight = { light: 'directionalLight 1' }; // Valor inicial
    this.lightControls.add(this.selectedLight, 'light', this.lightOptions).name('Select Light').onChange(() => {
      // Aqui você pode colocar o código para atualizar a fonte de luz na cena
      this.addLights();
    });

    // Opção para habilitar/desabilitar a luz
    this.enableLight = { enable: true }; // Valor inicial
    this.lightControls.add(this.enableLight, 'enable').name('Enable Light');

    // Adicione outros controles para as propriedades da luz, dependendo da luz selecionada
    this.lightControls.open(); // Abra o painel de controle de luz

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

  // tt.click(); // disable open animation
});
