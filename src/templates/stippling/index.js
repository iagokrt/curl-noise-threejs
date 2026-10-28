import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import * as dat from 'dat.gui';
import Stats from 'stats.js';

import '../../styles/global.scss';
import daliImage from '../../../public/dali.jpg';
import stipplingParticlesVertex from '../../shader/stipplingVertex.glsl';
import stipplingParticlesFragment from '../../shader/stipplingFragment.glsl';
import stipplingPosition from '../../shader/stipplingPosition.glsl';
import stipplingVelocity from '../../shader/stipplingVelocity.glsl';

const STIPPLING_CAMERA = {
  fov: 75,
  position: [0, 0, 12],
  target: [0, 0, 0],
  minDistance: 5,
  maxDistance: 240,
  revealRadius: 5.15,
};

function installStipplingStyles() {
  const style = document.createElement('style');
  style.textContent = `
    body.stippling-study {
      overflow: hidden;
      background: #f1ead8;
      color: #003c44;
    }
    body.stippling-study #webgl {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      background: #f1ead8;
    }
    body.stippling-study .stippling-copy {
      position: fixed;
      left: 8%;
      bottom: 5.4rem;
      z-index: 2;
      max-width: min(40rem, 52vw);
      color: #003c44;
      pointer-events: none;
    }
    body.stippling-study .stippling-copy h1 {
      margin: 0 0 0.6rem;
      font-size: clamp(1.4rem, 2.8vw, 2.35rem);
      font-weight: 400;
      letter-spacing: 0.04em;
    }
    body.stippling-study .stippling-copy p {
      margin: 0;
      color: rgba(0,60,68,0.72);
      font-size: 0.86rem;
      line-height: 1.55;
    }
    body.stippling-study .stippling-copy p + p {
      margin-top: 0.35rem;
      color: rgba(0,60,68,0.58);
    }
    body.stippling-study .stippling-copy a {
      color: inherit;
      pointer-events: auto;
    }
    body.stippling-study .stippling-start {
      display: inline-block;
      margin-top: 0.9rem;
      border: 0;
      padding: 0;
      color: #007382;
      background: transparent;
      font: inherit;
      font-size: 1rem;
      cursor: pointer;
      pointer-events: auto;
      text-decoration: underline;
      text-underline-offset: 0.18em;
    }
    body.stippling-study .stippling-start.is-hidden {
      display: none;
    }
    body.stippling-study .stippling-footer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      padding: 1rem 8% 1.2rem;
      background: linear-gradient(180deg, rgba(241,234,216,0), rgba(241,234,216,0.9));
      pointer-events: none;
    }
    body.stippling-study .stippling-footer a {
      color: rgba(0,60,68,0.78);
      font-size: 0.82rem;
      line-height: 1.2;
      pointer-events: auto;
    }
    body.stippling-study .stippling-stats {
      z-index: 60 !important;
      top: 0.5rem !important;
      bottom: auto !important;
      left: 0.5rem !important;
    }
    @media (max-width: 975px) {
      body.stippling-study .dg.main {
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
      body.stippling-study .stippling-copy {
        left: 1.5rem;
        right: 1.5rem;
        bottom: 5.3rem;
        max-width: none;
      }
      body.stippling-study .stippling-footer {
        padding: 0.95rem 1.5rem 1.15rem;
      }
    }
  `;
  document.head.appendChild(style);
}

class StipplingScene {
  constructor(options) {
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.time = 0;
    this.frames = 0;
    this.isStarted = false;
    this.particleSize = 26;
    this.size = window.matchMedia('(max-width: 760px)').matches ? 56 : 72;
    this.particles = this.size * this.size;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 0.01, 280);
    this.camera.fov = STIPPLING_CAMERA.fov;
    this.camera.position.set(...STIPPLING_CAMERA.position);
    this.camera.lookAt(new THREE.Vector3(...STIPPLING_CAMERA.target));
    this.camera.updateProjectionMatrix();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !window.matchMedia('(max-width: 760px)').matches,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xf1ead8, 0);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.8;
    this.controls.panSpeed = 0.55;
    this.controls.minDistance = STIPPLING_CAMERA.minDistance;
    this.controls.maxDistance = STIPPLING_CAMERA.maxDistance;
    this.controls.target.set(...STIPPLING_CAMERA.target);
    this.controls.saveState();

    this.texture = new THREE.TextureLoader().load(daliImage);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;

    this.defaultSettings = {
      revealSpeed: 10,
      revealRadius: STIPPLING_CAMERA.revealRadius,
      repulsion: 0.03,
      pointSize: this.particleSize,
    };
    this.settings = { ...this.defaultSettings };
    this.gui = new dat.GUI();
    this.gui.close();
    this.guiControllers = [
      this.gui.add(this.settings, 'revealSpeed', 1, 40, 1),
      this.gui.add(this.settings, 'revealRadius', 1, 8, 0.01),
      this.gui.add(this.settings, 'repulsion', 0, 0.12, 0.001),
      this.gui.add(this.settings, 'pointSize', 8, 40, 1),
    ];
    this.gui.add({ reset: () => this.reset() }, 'reset').name('Reset simulation');

    if (window.matchMedia('(max-width: 975px)').matches) {
      this.gui.open();
    }

    this.createStipplingStudy();
    this.resize();
    this.setupStats();
    this.renderer.render(this.scene, this.camera);
    window.addEventListener('resize', () => this.resize());
    window.onload = () => {
      document.getElementById('loading').style.display = 'none';
    };
  }

  start() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.render();
  }

  setupStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.classList.add('stippling-stats');
    this.stats.dom.style.zIndex = '60';
    this.stats.dom.style.top = '0.5rem';
    this.stats.dom.style.bottom = 'auto';
    this.stats.dom.style.left = '0.5rem';
    document.body.appendChild(this.stats.dom);
  }

  createStipplingStudy() {
    const gpu = new GPUComputationRenderer(this.size, this.size, this.renderer);
    const positionTexture = gpu.createTexture();
    const velocityTexture = gpu.createTexture();
    this.positionInitialTexture = positionTexture;
    this.velocityInitialTexture = velocityTexture;
    const positions = positionTexture.image.data;
    const velocities = velocityTexture.image.data;

    for (let i = 0; i < this.particles; i += 1) {
      const offset = i * 4;
      const radius = 4.2 * Math.pow(Math.random(), 0.5);
      const angle = Math.random() * Math.PI * 2;

      positions[offset] = radius * Math.cos(angle);
      positions[offset + 1] = radius * Math.sin(angle);
      positions[offset + 2] = 0;
      positions[offset + 3] = 1;
      velocities[offset] = 0;
      velocities[offset + 1] = 0;
      velocities[offset + 2] = 0;
      velocities[offset + 3] = 1;
    }

    const textureOffset = new THREE.Vector2(4.8, 4.8);
    const positionVariable = gpu.addVariable('u_positionTexture', stipplingPosition, positionTexture);
    const velocityVariable = gpu.addVariable('u_velocityTexture', stipplingVelocity, velocityTexture);
    gpu.setVariableDependencies(positionVariable, [positionVariable, velocityVariable]);
    gpu.setVariableDependencies(velocityVariable, [positionVariable, velocityVariable]);

    positionVariable.material.uniforms.u_dt = { value: 0.24 };
    positionVariable.material.uniforms.u_nActiveParticles = { value: 1 };
    positionVariable.material.uniforms.u_revealRadius = { value: 0.45 };
    velocityVariable.material.uniforms.u_dt = { value: 0.24 };
    velocityVariable.material.uniforms.u_nActiveParticles = { value: 1 };
    velocityVariable.material.uniforms.u_bgTexture = { value: this.texture };
    velocityVariable.material.uniforms.u_textureOffset = { value: textureOffset };
    velocityVariable.material.uniforms.u_repulsion = { value: this.settings.repulsion };
    velocityVariable.material.uniforms.u_revealRadius = { value: 0.45 };

    const error = gpu.init();
    if (error !== null) console.error(error);

    const geometry = new THREE.BufferGeometry();
    const indices = new Float32Array(this.particles);
    const placeholder = new Float32Array(this.particles * 3);
    for (let i = 0; i < this.particles; i += 1) indices[i] = i;
    geometry.setAttribute('aIndex', new THREE.BufferAttribute(indices, 1));
    geometry.setAttribute('position', new THREE.BufferAttribute(placeholder, 3));

    const material = new THREE.ShaderMaterial({
      vertexShader: stipplingParticlesVertex,
      fragmentShader: stipplingParticlesFragment,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        u_width: { value: this.size },
        u_height: { value: this.size },
        u_particleSize: { value: this.particleSize },
        u_nActiveParticles: { value: 1 },
        u_positionTexture: { value: null },
        u_bgTexture: { value: this.texture },
        u_textureOffset: { value: textureOffset },
        u_revealRadius: { value: 0.45 },
      },
    });

    this.points = new THREE.Points(geometry, material);
    this.points.scale.set(0.64, 0.64, 0.64);
    this.scene.add(this.points);
    this.gpu = gpu;
    this.positionVariable = positionVariable;
    this.velocityVariable = velocityVariable;
    this.material = material;
  }

  reset() {
    this.frames = 0;
    this.gpu.renderTexture(this.positionInitialTexture, this.positionVariable.renderTargets[0]);
    this.gpu.renderTexture(this.positionInitialTexture, this.positionVariable.renderTargets[1]);
    this.gpu.renderTexture(this.velocityInitialTexture, this.velocityVariable.renderTargets[0]);
    this.gpu.renderTexture(this.velocityInitialTexture, this.velocityVariable.renderTargets[1]);
    this.gpu.currentTextureIndex = 0;
    this.positionVariable.material.uniforms.u_nActiveParticles.value = 1;
    this.positionVariable.material.uniforms.u_revealRadius.value = 0.45;
    this.velocityVariable.material.uniforms.u_nActiveParticles.value = 1;
    this.velocityVariable.material.uniforms.u_revealRadius.value = 0.45;
    this.material.uniforms.u_nActiveParticles.value = 1;
    this.material.uniforms.u_revealRadius.value = 0.45;
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.material.uniforms.u_particleSize.value = window.matchMedia('(max-width: 760px)').matches ? 18 : this.settings.pointSize;
  }

  render() {
    if (!this.isStarted) return;

    this.stats.begin();
    this.time += 0.016;
    const activeParticles = Math.min(this.particles, Math.ceil(this.frames * this.settings.revealSpeed));
    const revealRadius = Math.min(this.settings.revealRadius, 0.38 + this.frames * 0.018);

    this.positionVariable.material.uniforms.u_nActiveParticles.value = activeParticles;
    this.positionVariable.material.uniforms.u_revealRadius.value = revealRadius;
    this.velocityVariable.material.uniforms.u_nActiveParticles.value = activeParticles;
    this.velocityVariable.material.uniforms.u_revealRadius.value = revealRadius;
    this.velocityVariable.material.uniforms.u_repulsion.value = this.settings.repulsion;
    this.material.uniforms.u_nActiveParticles.value = activeParticles;
    this.material.uniforms.u_revealRadius.value = revealRadius;
    this.material.uniforms.u_particleSize.value = this.settings.pointSize;

    this.gpu.compute();
    this.material.uniforms.u_positionTexture.value = this.gpu
      .getCurrentRenderTarget(this.positionVariable).texture;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
    this.frames += 1;
    requestAnimationFrame(() => this.render());
  }
}

class StipplingMenu {
  constructor(scene) {
    this.scene = scene;
    this.startItem = document.querySelector('.stippling-start');
    this.startItem.addEventListener('click', (event) => this.handleStartClick(event));
  }

  handleStartClick(event) {
    event.preventDefault();
    this.scene.start();
    this.startItem.classList.add('is-hidden');
  }
}

function createPage() {
  document.body.classList.add('stippling-study');
  installStipplingStyles();
  document.body.innerHTML = `
    <main>
      <div id="webgl"></div>
      <section class="stippling-copy" aria-label="Experiment notes">
        <h1>Stippling Technique - Dali</h1>
        <p>A Salvador Dalí portrait reconstructed through GPU-driven stippling, where a grid of particles reveals the image and responds to interactive repulsion.</p>
        <p>Based on the Stippling <a href="https://webgl-shaders.com/stippling-example.html" target="_blank" rel="noreferrer">Example</a> by WebGL Shaders.</p>
        <button class="stippling-start" type="button">Start experiment</button>
      </section>
      <footer class="stippling-footer">
        <a href="/index.html">‹ back to homepage</a>
      </footer>
    </main>
    <aside id="loading"><h1>Loading...</h1></aside>
  `;
  const scene = new StipplingScene({ dom: document.getElementById('webgl') });
  new StipplingMenu(scene);
}

document.addEventListener('DOMContentLoaded', createPage);
