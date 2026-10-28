import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';
import * as dat from 'dat.gui';
import Stats from 'stats.js';

import '../../styles/global.scss';
import noisePointsVertex from '../../shader/noisePointsVertex.glsl';
import noisePointsFragment from '../../shader/noisePointsFragment.glsl';
import noisePointsSimulation from '../../shader/noisePointsSimulation.glsl';
import noisePlaneVertex from '../../shader/noisePlaneVertex.glsl';

// This is the small FBO/curl-noise study from 0f0c892 (the source of public/demo.gif).
// Keep its deliberately narrow camera and shader-driven motion intact while giving it
// the same page shell as the other recovered experiments.
const WIDTH = 64;
const DEFAULT_POINT_COUNT = 1024;
const NOISE_CAMERA = {
  position: [0.5, 0.5, 50],
  target: [0.5, 0.5, 0],
};

class NoisePointsScene {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.time = 0;
    this.isPlaying = true;

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x243238, 1);
    this.renderer.physicallyCorrectLights = true;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      1,
      window.innerWidth / window.innerHeight,
      0.001,
      2500,
    );
    this.camera.position.set(...NOISE_CAMERA.position);
    this.camera.lookAt(new THREE.Vector3(...NOISE_CAMERA.target));
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...NOISE_CAMERA.target);
    this.controls.update();
    this.controls.saveState();

    this.initGPGPU();
    this.addParticles();
    this.resize();
    this.setupStats();
    this.settings();

    window.addEventListener('resize', () => this.resize());
    window.onload = () => {
      const loading = document.getElementById('loading');
      const header = document.querySelector('header');
      if (loading) loading.style.display = 'none';
      if (header) header.style.display = 'block';
    };

    this.render();
  }

  initGPGPU() {
    this.gpuCompute = new GPUComputationRenderer(WIDTH, WIDTH, this.renderer);
    this.positionTexture = this.gpuCompute.createTexture();
    this.positionInitialTexture = this.positionTexture;
    this.fillPixels(this.positionTexture);

    this.positionVariable = this.gpuCompute.addVariable(
      'texturePosition',
      noisePointsSimulation,
      this.positionTexture,
    );
    this.positionVariable.material.uniforms.time = { value: 0 };
    this.positionVariable.material.uniforms.noiseAmplitude = { value: 0.001 };
    this.positionVariable.material.uniforms.noiseSpeed = { value: 0.05 };
    this.positionVariable.wrapS = THREE.RepeatWrapping;
    this.positionVariable.wrapT = THREE.RepeatWrapping;

    const error = this.gpuCompute.init();
    if (error) console.warn(`Noise points GPU setup: ${error}`);
  }

  fillPixels(texture) {
    const data = texture.image.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.random();
      data[i + 1] = Math.random();
      data[i + 2] = Math.random();
      data[i + 3] = 1;
    }
  }

  settings() {
    // The original study intentionally left dat.GUI open: the black “Close Controls”
    // strip is part of the recovered composition shown in public/demo.gif.
    this.gui = new dat.GUI();
    this.guiSettings = {
      renderMode: 'Points',
      pointCount: DEFAULT_POINT_COUNT,
      pointSize: 300,
      noiseAmplitude: 0.001,
      noiseSpeed: 0.05,
      planeDisplacement: 1,
    };
    this.gui.add(this.guiSettings, 'renderMode', ['Points', 'Plane'])
      .name('Geometry')
      .onChange((value) => this.setRenderMode(value));
    this.gui.add(this.guiSettings, 'pointCount', 64, WIDTH * WIDTH, 32)
      .name('Point count')
      .onChange((value) => this.setPointCount(value));
    this.gui.add(this.guiSettings, 'pointSize', 80, 600, 1).name('Point size');
    this.gui.add(this.guiSettings, 'noiseAmplitude', 0, 0.03, 0.001).name('Noise amplitude');
    this.gui.add(this.guiSettings, 'noiseSpeed', 0, 0.2, 0.001).name('Noise speed');
    this.gui.add(this.guiSettings, 'planeDisplacement', 0, 4, 0.01).name('Plane displacement');
    this.gui.add({ reset: () => this.reset() }, 'reset').name('Reset simulation');
  }

  setupStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.style.zIndex = '30';
    document.body.appendChild(this.stats.dom);
  }

  addParticles() {
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: '#extension GL_OES_standard_derivatives :enable',
      },
      uniforms: {
        time: { value: 0 },
        positionTexture: { value: null },
        resolution: { value: new THREE.Vector4() },
        pointSize: { value: 300 },
      },
      vertexShader: noisePointsVertex,
      fragmentShader: noisePointsFragment,
    });

    const positions = new Float32Array(WIDTH * WIDTH * 3);
    const references = new Float32Array(WIDTH * WIDTH * 2);

    for (let i = 0; i < WIDTH * WIDTH; i += 1) {
      const offset = i * 3;
      const referenceOffset = i * 2;
      positions[offset] = Math.random();
      positions[offset + 1] = Math.random();
      positions[offset + 2] = Math.random();
      references[referenceOffset] = (i % WIDTH) / WIDTH;
      references[referenceOffset + 1] = Math.floor(i / WIDTH) / WIDTH;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('reference', new THREE.BufferAttribute(references, 2));
    this.referenceAttribute = this.geometry.getAttribute('reference');
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
    this.planeGeometry = new THREE.PlaneBufferGeometry(2.4, 2.4, WIDTH - 1, WIDTH - 1);
    this.planeMaterial = new THREE.ShaderMaterial({
      vertexShader: noisePlaneVertex,
      fragmentShader: noisePointsFragment,
      uniforms: {
        time: { value: 0 },
        positionTexture: { value: null },
        planeDisplacement: { value: 1 },
      },
      side: THREE.DoubleSide,
    });
    this.plane = new THREE.Mesh(this.planeGeometry, this.planeMaterial);
    this.plane.position.set(...NOISE_CAMERA.target);
    this.plane.visible = false;
    this.scene.add(this.plane);
    this.setPointCount(this.guiSettings ? this.guiSettings.pointCount : DEFAULT_POINT_COUNT);
    this.setRenderMode(this.guiSettings ? this.guiSettings.renderMode : 'Points');
  }

  setPointCount(value) {
    const count = Math.max(64, Math.min(WIDTH * WIDTH, Math.round(value / 32) * 32));
    if (this.guiSettings) this.guiSettings.pointCount = count;

    if (!this.geometry || !this.referenceAttribute) return;

    const references = this.referenceAttribute.array;
    for (let i = 0; i < WIDTH * WIDTH; i += 1) {
      const offset = i * 2;
      const sourceIndex = Math.min(WIDTH * WIDTH - 1, Math.floor(i * (WIDTH * WIDTH) / count));
      references[offset] = (sourceIndex % WIDTH) / WIDTH;
      references[offset + 1] = Math.floor(sourceIndex / WIDTH) / WIDTH;
    }
    this.referenceAttribute.needsUpdate = true;
    this.geometry.setDrawRange(0, count);
  }

  setRenderMode(value) {
    const mode = value === 'Plane' ? 'Plane' : 'Points';
    if (this.guiSettings) this.guiSettings.renderMode = mode;
    if (this.points) this.points.visible = mode === 'Points';
    if (this.plane) this.plane.visible = mode === 'Plane';
  }

  reset() {
    this.time = 0;
    this.gpuCompute.renderTexture(this.positionInitialTexture, this.positionVariable.renderTargets[0]);
    this.gpuCompute.renderTexture(this.positionInitialTexture, this.positionVariable.renderTargets[1]);
    this.gpuCompute.currentTextureIndex = 0;
    this.positionVariable.material.uniforms.time.value = 0;
    this.setPointCount(this.guiSettings.pointCount);
    this.setRenderMode(this.guiSettings.renderMode);
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.render();
    }
  }

  render() {
    if (!this.isPlaying) return;

    this.stats.begin();
    this.time += 0.05;
    this.positionVariable.material.uniforms.time.value = this.time;
    this.positionVariable.material.uniforms.noiseAmplitude.value = this.guiSettings.noiseAmplitude;
    this.positionVariable.material.uniforms.noiseSpeed.value = this.guiSettings.noiseSpeed;
    this.gpuCompute.compute();
    const positionTexture = this.gpuCompute
      .getCurrentRenderTarget(this.positionVariable).texture;
    this.material.uniforms.positionTexture.value = positionTexture;
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.pointSize.value = this.guiSettings.pointSize;
    this.planeMaterial.uniforms.positionTexture.value = positionTexture;
    this.planeMaterial.uniforms.time.value = this.time;
    this.planeMaterial.uniforms.planeDisplacement.value = this.guiSettings.planeDisplacement;

    this.renderer.render(this.scene, this.camera);
    this.stats.end();
    requestAnimationFrame(() => this.render());
  }
}

function createPage() {
  document.body.innerHTML = `
    <main>
      <header class="header">
        <a class="logo" href="/index.html" title="Back to homepage">WebGL</a>
        <span class="breadcrumb-separator">›</span>
        <span class="logo logo-item">Using noise and Points</span>
      </header>
      <div id="webgl"></div>
    </main>
    <button id="noise-help-toggle" class="noise-help-toggle" type="button" aria-expanded="false" aria-controls="noise-help">
      ? How it works
    </button>
    <aside id="noise-help" class="noise-help" hidden>
      <h2>How this study works</h2>
      <p><strong>GPU simulation</strong> stores the position of each particle in <code>texturePosition</code>.</p>
      <p><strong>Simulation shader:</strong> <code>noisePointsSimulation.glsl</code> samples simplex <code>noise()</code>, builds a vector field with <code>curl()</code>, and advances each position over time.</p>
      <p><strong>Vertex shader:</strong> <code>noisePointsVertex.glsl</code> uses each particle's <code>reference</code> UV to read that texture, projects the position with the camera, and sets <code>gl_PointSize</code>.</p>
      <p><strong>Fragment shader:</strong> <code>noisePointsFragment.glsl</code> colors each point from its UV, producing the original red/green palette.</p>
      <p><strong>Plane mode:</strong> switch <code>Geometry</code> in dat.GUI to compare those explicit references with the native <code>uv</code> coordinates of a <code>PlaneBufferGeometry</code>.</p>
    </aside>
    <aside id="loading"><h1>Loading...</h1></aside>
  `;
  const helpToggle = document.getElementById('noise-help-toggle');
  const helpPanel = document.getElementById('noise-help');
  helpToggle.addEventListener('click', () => {
    const isOpening = helpPanel.hidden;
    helpPanel.hidden = !isOpening;
    helpToggle.setAttribute('aria-expanded', String(isOpening));
  });
  new NoisePointsScene({ dom: document.getElementById('webgl') });
}

document.addEventListener('DOMContentLoaded', createPage);
