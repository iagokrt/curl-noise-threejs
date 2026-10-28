import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'dat.gui';

import '../../styles/global.scss';
import sourceImage from '../../../public/pain.jpg';
import vertex from '../../shader/rgbShiftVertex.glsl';
import fragment from '../../shader/rgbShiftFragment.glsl';

const IMAGE_ASPECT = 2048 / 1152;

function installStyles() {
  const style = document.createElement('style');
  style.textContent = `
    html.rgb-shift-study,
    body.rgb-shift-study {
      overflow-x: hidden !important;
      overflow-y: hidden !important;
      background: #11100f;
    }
    .rgb-shift-study header.header {
      display: flex !important;
      height: auto !important;
      min-height: 0 !important;
      position: fixed !important;
      z-index: 3;
      pointer-events: none;
    }
    .rgb-shift-study header.header a {
      pointer-events: auto;
    }
    .rgb-shift-study #webgl {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
      cursor: grab;
      touch-action: none;
      user-select: none;
    }
    .rgb-shift-study #webgl canvas {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
    }
    .rgb-shift-study #webgl.is-dragging {
      cursor: grabbing;
    }
    .rgb-shift-study .rgb-copy {
      position: fixed;
      left: 10%;
      bottom: 5.4rem;
      z-index: 2;
      max-width: 25rem;
      color: rgba(255,255,255,0.72);
      pointer-events: none;
    }
    .rgb-shift-study .rgb-footer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      padding: 1rem 10% 1.2rem;
      background: linear-gradient(180deg, rgba(17,16,15,0), rgba(17,16,15,0.86));
      pointer-events: none;
    }
    .rgb-shift-study .rgb-footer a {
      color: rgba(255,255,255,0.78);
      font-size: 0.82rem;
      line-height: 1.2;
      pointer-events: auto;
    }
    .rgb-shift-study .rgb-copy h1 {
      margin: 0 0 0.55rem;
      font-size: clamp(1.4rem, 2.8vw, 2.35rem);
      font-weight: 400;
      letter-spacing: 0.04em;
    }
    .rgb-shift-study .rgb-copy p {
      margin: 0;
      color: rgba(255,255,255,0.52);
      font-size: 0.86rem;
      line-height: 1.5;
    }
    .rgb-shift-study .scroll-spacer {
      height: 100vh;
      pointer-events: none;
    }
    @media (max-width: 975px) {
      .rgb-shift-study .rgb-copy {
        left: 1.5rem;
        right: 1.5rem;
        bottom: 5.3rem;
      }
      .rgb-shift-study .rgb-footer {
        padding: 0.95rem 1.5rem 1.15rem;
      }
    }
  `;
  document.head.appendChild(style);
}

class RGBShiftScene {
  constructor(container) {
    this.container = container;
    this.time = 0;
    this.scrollVelocity = 0;
    this.scrollVelocityTarget = 0;
    this.dragVelocity = 0;
    this.dragVelocityTarget = 0;
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.dragOffset = new THREE.Vector2();
    this.dragOffsetTarget = new THREE.Vector2();
    this.scrollWorld = 0;
    this.scrollWorldTarget = 0;
    this.cardCount = 4;
    this.cardStep = 1.42;

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    this.camera.position.z = 2;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x11100f, 1);
    this.container.appendChild(this.renderer.domElement);

    this.texture = new THREE.TextureLoader().load(sourceImage);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;

    this.settings = {
      rgbShift: 0.024,
      distortion: 0.06,
      scrollResponse: 1.0,
    };
    this.defaultSettings = { ...this.settings };

    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: {
        uTexture: { value: this.texture },
        uTime: { value: 0 },
        uScrollVelocity: { value: 0 },
        uRgbShift: { value: this.settings.rgbShift },
        uDistortion: { value: this.settings.distortion },
      },
    });

    this.imageGroup = new THREE.Group();
    const geometry = new THREE.PlaneBufferGeometry(2, 2, 96, 96);
    for (let index = 0; index < this.cardCount; index += 1) {
      const card = new THREE.Mesh(geometry, this.material);
      card.position.y = (index - (this.cardCount - 1) / 2) * this.cardStep;
      this.imageGroup.add(card);
    }
    this.scene.add(this.imageGroup);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enabled = false;

    this.gui = new dat.GUI();
    this.gui.close();
    this.gui.add(this.settings, 'rgbShift', 0, 0.12, 0.001).name('RGB shift').onChange((value) => {
      this.material.uniforms.uRgbShift.value = value;
    });
    this.gui.add(this.settings, 'distortion', 0, 0.25, 0.001).name('Plane distortion').onChange((value) => {
      this.material.uniforms.uDistortion.value = value;
    });
    this.gui.add(this.settings, 'scrollResponse', 0.1, 2, 0.05).name('Scroll response');
    this.gui.add({ reset: () => this.reset() }, 'reset').name('Reset controls');

    this.handleWheel = this.handleWheel.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.resize = this.resize.bind(this);
    this.render = this.render.bind(this);
    window.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('resize', this.resize);
    this.renderer.domElement.addEventListener('pointerdown', this.handlePointerDown);
    this.renderer.domElement.addEventListener('pointermove', this.handlePointerMove);
    window.addEventListener('pointerup', this.handlePointerUp);
    window.addEventListener('pointercancel', this.handlePointerUp);
    this.resize();
    this.render();
  }

  handleWheel(event) {
    event.preventDefault();
    const delta = THREE.MathUtils.clamp(event.deltaY, -160, 160);
    this.scrollWorldTarget += (delta / Math.max(window.innerHeight, 1)) * 1.8;
    this.scrollVelocityTarget = THREE.MathUtils.clamp(delta / 80, -1, 1);
  }

  handlePointerDown(event) {
    event.preventDefault();
    this.isDragging = true;
    this.lastPointer.x = event.clientX;
    this.lastPointer.y = event.clientY;
    this.container.classList.add('is-dragging');
    if (this.renderer.domElement.setPointerCapture) {
      this.renderer.domElement.setPointerCapture(event.pointerId);
    }
  }

  handlePointerMove(event) {
    if (!this.isDragging) return;
    event.preventDefault();

    const dx = event.clientX - this.lastPointer.x;
    const dy = event.clientY - this.lastPointer.y;
    this.lastPointer.x = event.clientX;
    this.lastPointer.y = event.clientY;

    this.dragVelocityTarget = THREE.MathUtils.clamp((dx / window.innerWidth) * 5 + (dy / window.innerHeight) * 2, -1, 1);
    // Touch screens do not emit wheel events. Feed the vertical gesture into
    // the same virtual scroll accumulator used by the desktop wheel input.
    this.scrollWorldTarget -= (dy / Math.max(window.innerHeight, 1)) * 2.2;
    this.scrollVelocityTarget = THREE.MathUtils.clamp((-dy / Math.max(window.innerHeight, 1)) * 5, -1, 1);
    this.dragOffsetTarget.x = THREE.MathUtils.clamp(this.dragOffsetTarget.x + (dx / window.innerWidth) * 0.7, -0.3, 0.3);
    this.dragOffsetTarget.y = THREE.MathUtils.clamp(this.dragOffsetTarget.y - (dy / window.innerHeight) * 0.7, -0.3, 0.3);
  }

  handlePointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.scrollVelocityTarget = 0;
    this.container.classList.remove('is-dragging');
  }

  reset() {
    Object.assign(this.settings, this.defaultSettings);
    this.material.uniforms.uRgbShift.value = this.settings.rgbShift;
    this.material.uniforms.uDistortion.value = this.settings.distortion;
    this.scrollVelocity = 0;
    this.scrollVelocityTarget = 0;
    this.dragVelocity = 0;
    this.dragVelocityTarget = 0;
    this.scrollWorld = 0;
    this.scrollWorldTarget = 0;
    this.dragOffset.set(0, 0);
    this.dragOffsetTarget.set(0, 0);
    this.gui.updateDisplay();
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspect = width / height;
    this.renderer.setSize(width, height);
    this.camera.left = -aspect;
    this.camera.right = aspect;
    this.camera.updateProjectionMatrix();

    // Keep the source ratio intact while making the image a smaller card.
    const cardWidth = Math.min(aspect * 1.45, 1.65);
    const cardHeight = cardWidth / IMAGE_ASPECT;
    this.imageGroup.children.forEach((card) => {
      card.scale.set(cardWidth / 2, cardHeight / 2, 1);
    });
  }

  render() {
    this.time += 0.016;
    this.scrollVelocityTarget *= 0.92;
    this.scrollVelocity = THREE.MathUtils.lerp(this.scrollVelocity, this.scrollVelocityTarget, 0.12);
    this.dragVelocityTarget *= this.isDragging ? 0.96 : 0.86;
    this.dragVelocity = THREE.MathUtils.lerp(this.dragVelocity, this.dragVelocityTarget, 0.16);
    if (!this.isDragging) this.dragOffsetTarget.multiplyScalar(0.9);
    this.dragOffset.lerp(this.dragOffsetTarget, 0.12);
    this.scrollWorld = THREE.MathUtils.lerp(this.scrollWorld, this.scrollWorldTarget, 0.08);
    this.material.uniforms.uTime.value = this.time;
    const inputVelocity = THREE.MathUtils.clamp(
      this.scrollVelocity * this.settings.scrollResponse + this.dragVelocity * 1.35,
      -1,
      1,
    );
    this.material.uniforms.uScrollVelocity.value = inputVelocity;
    this.imageGroup.rotation.z = inputVelocity * 0.018;
    this.imageGroup.position.x = this.dragOffset.x;
    this.imageGroup.position.y = this.dragOffset.y + inputVelocity * 0.018;

    // Recycle cards as they leave the viewport, keeping the sequence endless.
    const loopHeight = this.cardCount * this.cardStep;
    this.imageGroup.children.forEach((card, index) => {
      const base = (index - (this.cardCount - 1) / 2) * this.cardStep;
      let y = base - this.scrollWorld;
      y = ((y + loopHeight / 2) % loopHeight + loopHeight) % loopHeight - loopHeight / 2;
      card.position.y = y;
    });

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render);
  }
}

function createPage() {
  document.documentElement.classList.add('rgb-shift-study');
  document.body.classList.add('rgb-shift-study');
  document.body.innerHTML = `
    <main>
      <div id="webgl"></div>
      <section class="rgb-copy">
        <h1>RGB Shift</h1>
        <p>Scroll or click and drag to push the plane and separate its color channels.</p>
      </section>
      <footer class="rgb-footer">
        <a href="/index.html">‹ back to homepage</a>
      </footer>
      <div class="scroll-spacer" aria-hidden="true"></div>
    </main>
  `;
  installStyles();
  new RGBShiftScene(document.getElementById('webgl'));
}

document.addEventListener('DOMContentLoaded', createPage);
