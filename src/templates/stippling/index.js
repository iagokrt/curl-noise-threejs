import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import * as dat from 'dat.gui';

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
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0xf1ead8, 1);
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

    this.createStipplingStudy();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    window.onload = () => {
      document.getElementById('loading').style.display = 'none';
      const header = document.querySelector('.header');
      if (header) header.style.display = 'flex';
    };
  }

  start() {
    if (this.isStarted) return;
    this.isStarted = true;
    this.render();
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
    this.frames += 1;
    requestAnimationFrame(() => this.render());
  }
}

class StipplingMenu {
  constructor(scene) {
    this.scene = scene;
    this.startItem = document.querySelector('.stippling-menu .start');
    this.aboutItem = document.querySelector('.stippling-menu .about');
    this.creditItem = document.querySelector('.stippling-menu .credits');
    this.creditLink = document.querySelector('.stippling-credit');

    this.startItem.addEventListener('click', (event) => this.handleStartClick(event));
    this.aboutItem.addEventListener('click', (event) => this.handleInfoClick(event, '.about .info'));
    this.creditItem.addEventListener('click', (event) => this.handleInfoClick(event, '.credits .info'));
    this.creditItem.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.handleInfoClick(event, '.credits .info');
      }
    });
    this.creditLink.addEventListener('click', (event) => event.stopPropagation());
  }

  handleStartClick(event) {
    event.preventDefault();
    this.scene.start();
    document.querySelector('.header').classList.add('collapsed');
    this.startItem.classList.add('hidden');
  }

  handleInfoClick(event, selector) {
    event.preventDefault();
    document.querySelector(`.stippling-menu ${selector}`).classList.toggle('hidden');
  }
}

function createPage() {
  document.body.classList.add('stippling-study');
  document.body.innerHTML = `
    <main>
      <header class="header">
        <aside class="logoTitle">
          <a class="logo" href="#">Stippling Technique - Dali</a>
          <a class="logoBackButton" href="/index.html">‹ back to homepage</a>
        </aside>
        <nav class="navbar desktop-menu stippling-menu" aria-label="Experiment menu">
          <a class="nav-item start" href="#start">⦿ Start</a>
          <a class="nav-item about" href="#about">
            ⦿ About this Experiment
            <aside class="info hidden">A Salvador Dalí portrait reconstructed through GPU-driven stippling, where a grid of particles reveals the image and responds to interactive repulsion.</aside>
          </a>
          <div class="nav-item credits" role="button" tabindex="0">
            ⦿ Credits
            <aside class="info hidden">
              Based on the Stippling <a class="stippling-credit" href="https://webgl-shaders.com/stippling-example.html" target="_blank" rel="noreferrer">Example</a> by WebGL Shaders.
            </aside>
          </div>
        </nav>
      </header>
      <div id="webgl"></div>
    </main>
    <aside id="loading"><h1>Loading...</h1></aside>
  `;
  const scene = new StipplingScene({ dom: document.getElementById('webgl') });
  new StipplingMenu(scene);
}

document.addEventListener('DOMContentLoaded', createPage);
