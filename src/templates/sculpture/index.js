import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// settings and animations 
import * as dat from 'dat.gui';
import gsap from 'gsap';
import Stats from 'stats.js';

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

function installSculptureStyles() {
  const style = document.createElement('style');
  style.textContent = `
    body.sculpture-study {
      overflow: hidden;
      background: #01080b;
    }
    body.sculpture-study #webgl {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
    }
    body.sculpture-study .sculpture-copy {
      position: fixed;
      left: 8%;
      bottom: 5.4rem;
      z-index: 2;
      max-width: min(42rem, 52vw);
      color: rgba(255,255,255,0.86);
      pointer-events: none;
    }
    body.sculpture-study .sculpture-footer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      padding: 1rem 8% 1.2rem;
      background: linear-gradient(180deg, rgba(1,8,11,0), rgba(1,8,11,0.88));
      pointer-events: none;
    }
    body.sculpture-study .sculpture-footer a {
      color: rgba(255,255,255,0.78);
      font-size: 0.82rem;
      line-height: 1.2;
      pointer-events: auto;
    }
    body.sculpture-study .sculpture-copy h1 {
      margin: 0 0 0.6rem;
      font-size: clamp(1.4rem, 2.8vw, 2.35rem);
      font-weight: 400;
      letter-spacing: 0.04em;
    }
    body.sculpture-study .sculpture-copy p {
      margin: 0;
      color: rgba(255,255,255,0.58);
      font-size: 0.86rem;
      line-height: 1.55;
    }
    body.sculpture-study .sculpture-copy p + p {
      margin-top: 0.35rem;
      color: rgba(255,255,255,0.42);
    }
    body.sculpture-study .sculpture-stats {
      z-index: 60 !important;
      top: 0.5rem !important;
      bottom: auto !important;
      left: 0.5rem !important;
    }
    @media (max-width: 975px) {
      body.sculpture-study .dg.main {
        position: fixed !important;
        top: 0.5rem !important;
        bottom: auto !important;
        right: 0 !important;
        width: min(280px, calc(100vw - 0.75rem)) !important;
        max-width: calc(100vw - 0.75rem);
        z-index: 50 !important;
        max-height: 45vh;
        overflow-y: auto;
      }
      body.sculpture-study .sculpture-copy {
        left: 1.5rem;
        right: 1.5rem;
        bottom: 5.3rem;
        max-width: none;
      }
      body.sculpture-study .sculpture-footer {
        padding: 0.95rem 1.5rem 1.15rem;
      }
      body.sculpture-study .sculpture-copy h1 {
        font-size: clamp(1.35rem, 6vw, 2rem);
      }
    }
  `;
  document.head.appendChild(style);
}

class HTMLContentGenerator {
  static generateMainContent() {
    const main = document.createElement('main');

    const webglDiv = document.createElement('div');
    webglDiv.id = 'webgl';

    main.appendChild(webglDiv);

    const copy = document.createElement('section');
    copy.classList.add('sculpture-copy');
    copy.innerHTML = `
      <h1>Nefertiti: Exploring Lights and Shadows</h1>
      <p>Exploring light and shadow through a 3D model of Nefertiti, experimenting with directional lights, materials, and real-time rendering.</p>
      <p>Inspired by Yuri Artiukh's creative coding tutorial. 3D model: BUST OF NEFERTITI, FOIA Results (Sketchfab).</p>
    `;
    main.appendChild(copy);

    const footer = document.createElement('footer');
    footer.classList.add('sculpture-footer');
    footer.innerHTML = '<a href="/index.html">‹ back to homepage</a>';
    main.appendChild(footer);

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
    this.setupStats();

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
      console.log('this.selectedLight.light:', this.selectedLight.light)

      const lightObjects = new AddLightObjects(this.scene);

      switch (this.selectedLight.light) {
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
      var count = 0;
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

    if (window.matchMedia('(max-width: 975px)').matches) {
      this.gui.open();
    }

  }

  setupStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.classList.add('sculpture-stats');
    this.stats.dom.style.zIndex = '60';
    this.stats.dom.style.top = '0.5rem';
    this.stats.dom.style.bottom = 'auto';
    this.stats.dom.style.left = '0.5rem';
    document.body.appendChild(this.stats.dom);

  }

  render() {
    if (!this.isPlaying) return;

    this.stats.begin();
    this.time += 0.05;

    // this.loadedModel.rotation += 0.02; // not working undefined
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);
    this.stats.end();

  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('sculpture-study');
  installSculptureStyles();
  const mainContent = HTMLContentGenerator.generateMainContent();
  const loadingContent = HTMLContentGenerator.generateLoadingContent();

  document.body.appendChild(mainContent);
  document.body.appendChild(loadingContent);

  new Particled({
    dom: document.getElementById('webgl'),
    menu: document.getElementById('menu')
  });
});
