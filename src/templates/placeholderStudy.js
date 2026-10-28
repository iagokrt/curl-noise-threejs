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
    .placeholder-study #webgl {
      position: fixed;
      inset: 0;
      z-index: 0;
    }
    .placeholder-study .placeholder-copy {
      position: fixed;
      left: 2.5rem;
      bottom: 5.4rem;
      z-index: 2;
      max-width: 28rem;
      color: rgba(255, 255, 255, 0.78);
      pointer-events: none;
    }
    .placeholder-study .placeholder-footer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      padding: 1rem 2.5rem 1.2rem;
      background: linear-gradient(180deg, rgba(36,50,56,0), rgba(36,50,56,0.9));
      pointer-events: none;
    }
    .placeholder-study .placeholder-footer a {
      color: rgba(255,255,255,0.78);
      font-size: 0.82rem;
      line-height: 1.2;
      pointer-events: auto;
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
      .placeholder-study .placeholder-copy {
        left: 1.5rem;
        right: 1.5rem;
        bottom: 5.3rem;
        max-width: none;
      }
      .placeholder-study .placeholder-footer {
        padding: 0.95rem 1.5rem 1.15rem;
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
      <div id="webgl"></div>
      <section class="placeholder-copy" aria-label="Experiment notes">
        <h1>${title}</h1>
        <p>${LOREM_IPSUM}</p>
      </section>
      <footer class="placeholder-footer">
        <a href="/index.html">‹ back to homepage</a>
      </footer>
    </main>
  `;
  installStyles();
  new PlaceholderScene(document.getElementById('webgl'));
}
