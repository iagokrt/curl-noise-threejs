import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import '../styles/global.scss';
import vertex from '../shader/placeholderPlaneVertex.glsl';
import fragment from '../shader/placeholderPlaneFragment.glsl';

const LOREM_IPSUM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Esta página é um espaço reservado para o próximo estudo.';

function installStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .placeholder-study header.header {
      display: flex !important;
      height: auto !important;
      min-height: 0 !important;
      position: relative !important;
      z-index: 2;
    }
    .placeholder-study #webgl {
      position: fixed;
      inset: 0;
      z-index: 0;
    }
    .placeholder-study .placeholder-copy {
      position: fixed;
      left: 2.5rem;
      bottom: 2.25rem;
      z-index: 2;
      max-width: 28rem;
      color: rgba(255, 255, 255, 0.78);
      pointer-events: none;
    }
    .placeholder-study .placeholder-copy h1 {
      margin: 0 0 0.7rem;
      font-size: clamp(1.4rem, 2.5vw, 2.25rem);
      font-weight: 400;
    }
    .placeholder-study .placeholder-copy p {
      margin: 0;
      max-width: 26rem;
      font-size: 0.9rem;
      line-height: 1.55;
      color: rgba(255, 255, 255, 0.58);
    }
    @media (max-width: 975px) {
      .placeholder-study .logoTitle .logo {
        font-size: clamp(1.7rem, 7vw, 3.2rem) !important;
      }
    }
  `;
  document.head.appendChild(style);
}

class PlaceholderScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    this.camera.position.set(0, 0, 3.2);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x243238, 1);
    this.container.appendChild(this.renderer.domElement);

    const geometry = new THREE.PlaneBufferGeometry(2, 2, 1, 1);
    const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment });
    this.scene.add(new THREE.Mesh(geometry, material));

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    window.addEventListener('resize', this.resize);
    this.resize();
    this.render();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
}

export function createPlaceholderStudy({ title }) {
  document.body.classList.add('placeholder-study');
  document.body.innerHTML = `
    <main>
      <header class="header">
        <aside class="logoTitle">
          <a class="logo" href="/index.html">${title}</a>
          <a class="logoBackButton" href="/index.html">‹ back to homepage</a>
        </aside>
      </header>
      <div id="webgl"></div>
      <section class="placeholder-copy" aria-label="Experiment notes">
        <h1>${title}</h1>
        <p>${LOREM_IPSUM}</p>
      </section>
    </main>
  `;
  installStyles();
  new PlaceholderScene(document.getElementById('webgl'));
}
