import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import * as dat from 'dat.gui';
import gsap from 'gsap';
import Stats from 'stats.js';

import '../../styles/global.scss';
import vertex from '../../shader/videoParticlesVertex.glsl';
import fragment from '../../shader/videoParticlesFragment.glsl';
import createReplicaPage from './replica.js';

const IMAGE_ASPECT = 480 / 820;

function installStyles() {
  const style = document.createElement('style');
  style.textContent = `
    body.video-particles-study {
      overflow: hidden;
      background: #02080d;
    }
    body.video-particles-study #webgl {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 0;
    }
    body.video-particles-study #video-source {
      display: none;
    }
    body.video-particles-study .video-particles-copy {
      position: fixed;
      left: 8%;
      bottom: 5.4rem;
      z-index: 2;
      max-width: min(38rem, 52vw);
      color: rgba(255,255,255,0.86);
      pointer-events: none;
    }
    body.video-particles-study .video-particles-copy h1 {
      margin: 0 0 0.6rem;
      font-size: clamp(1.4rem, 2.8vw, 2.35rem);
      font-weight: 400;
      letter-spacing: 0.04em;
    }
    body.video-particles-study .video-particles-copy p {
      margin: 0;
      color: rgba(255,255,255,0.58);
      font-size: 0.86rem;
      line-height: 1.5;
    }
    body.video-particles-study .video-particles-footer {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 3;
      display: flex;
      align-items: center;
      padding: 1rem 8% 1.2rem;
      background: linear-gradient(180deg, rgba(2,8,13,0), rgba(2,8,13,0.9));
      pointer-events: none;
    }
    body.video-particles-study .video-particles-footer a {
      color: rgba(255,255,255,0.78);
      font-size: 0.82rem;
      line-height: 1.2;
      pointer-events: auto;
    }
    body.video-particles-study .video-particles-stats {
      z-index: 60 !important;
      top: 0.5rem !important;
      bottom: auto !important;
      left: 0.5rem !important;
    }
    @media (max-width: 975px) {
      body.video-particles-study .dg.main {
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
      body.video-particles-study .video-particles-copy {
        left: 1.5rem;
        right: 1.5rem;
        bottom: 5.3rem;
        max-width: none;
      }
      body.video-particles-study .video-particles-footer {
        padding: 0.95rem 1.5rem 1.15rem;
      }
    }
  `;
  document.head.appendChild(style);
}

class VideoParticlesScene {
  constructor(container) {
    this.container = container;
    this.width = container.offsetWidth;
    this.height = container.offsetHeight;
    this.time = 0;
    this.isTransitioning = false;
    this.currentExample = 'a-end';

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 0, 8.2);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x02080d, 1);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, -1.15);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 3.5;
    this.controls.maxDistance = 24;
    this.controls.update();

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.width, this.height),
      0.15,
      0.45,
      0.2,
    );
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);

    this.settings = {
      distortion: 0.7,
      naturalFlow: 0.35,
      returnCurve: 2.8,
      bloomStrength: 0.15,
      particleSize: 0.072,
      explosionDuration: 1.25,
      explosionHold: 0.18,
      returnDuration: 1.8,
      contactPause: 0.12,
    };

    this.createParticles();
    this.setupGui();
    this.setupStats();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.render();
  }

  createParticles() {
    const geometry = new THREE.PlaneBufferGeometry(3.35, 3.35 / IMAGE_ASPECT, 180, 300);
    const loader = new THREE.TextureLoader();
    this.exampleTextures = {
      'a-start': loader.load('/video/a-start.jpg'),
      'a-end': loader.load('/video/a-end.jpg'),
      'b-start': loader.load('/video/b-start.jpg'),
      'b-end': loader.load('/video/b-end.jpg'),
    };
    Object.values(this.exampleTextures).forEach((texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    });
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uProgress: { value: 0 },
        uDistortion: { value: this.settings.distortion },
        uNatural: { value: this.settings.naturalFlow },
        uAnimation: { value: 0 },
        uReturning: { value: 0 },
        uReturnCurve: { value: this.settings.returnCurve },
        uPointSize: { value: this.settings.particleSize },
        uMomentum: { value: 0 },
        uTexture: { value: this.exampleTextures['a-end'] },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
    });
    this.particles = new THREE.Points(geometry, this.material);
    // Keep both representations on the exact same recessed plane. The extra
    // distance gives the particle lattice room to separate without sitting
    // directly against the camera projection.
    this.particles.position.z = -1.15;
    this.particles.visible = true;
    this.scene.add(this.particles);
  }

  setupGui() {
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'distortion', 0, 2.5, 0.01)
      .onChange((value) => { this.material.uniforms.uDistortion.value = value; });
    this.gui.add(this.settings, 'naturalFlow', 0, 1.5, 0.01)
      .name('curl flow')
      .onChange((value) => { this.material.uniforms.uNatural.value = value; });
    this.gui.add(this.settings, 'returnCurve', 1, 5, 0.05)
      .name('return curve')
      .onChange((value) => { this.material.uniforms.uReturnCurve.value = value; });
    this.gui.add(this.settings, 'particleSize', 0.015, 0.12, 0.001)
      .onChange((value) => { this.material.uniforms.uPointSize.value = value; });
    this.gui.add(this.settings, 'bloomStrength', 0, 2.5, 0.01)
      .onChange((value) => { this.bloomPass.strength = value; });
    this.gui.add(this.settings, 'explosionDuration', 0.5, 3, 0.05);
    this.gui.add(this.settings, 'explosionHold', 0, 1, 0.01);
    this.gui.add(this.settings, 'returnDuration', 0.5, 4, 0.05);
    this.gui.add(this.settings, 'contactPause', 0, 0.5, 0.01);
    this.gui.add({ aStart: () => this.showExample('a-start') }, 'aStart').name('Mesh: a-start');
    this.gui.add({ aEnd: () => this.showExample('a-end') }, 'aEnd').name('Mesh: a-end');
    this.gui.add({ bStart: () => this.showExample('b-start') }, 'bStart').name('Mesh: b-start');
    this.gui.add({ bEnd: () => this.showExample('b-end') }, 'bEnd').name('Mesh: b-end');
    this.gui.add({ animate: () => this.transition() }, 'animate').name('Explode / recompute');
    if (window.matchMedia('(max-width: 975px)').matches) this.gui.open();
    else this.gui.close();
  }

  setupStats() {
    this.stats = new Stats();
    this.stats.showPanel(0);
    this.stats.dom.classList.add('video-particles-stats');
    this.stats.dom.style.zIndex = '60';
    this.stats.dom.style.top = '0.5rem';
    this.stats.dom.style.bottom = 'auto';
    this.stats.dom.style.left = '0.5rem';
    document.body.appendChild(this.stats.dom);
  }

  showExample(name) {
    if (this.isTransitioning) {
      this.timeline?.kill();
      this.isTransitioning = false;
    }
    const texture = this.exampleTextures[name];
    if (!texture) return;
    this.currentExample = name;
    this.material.uniforms.uTexture.value = texture;
    this.material.uniforms.uProgress.value = 0;
    this.material.uniforms.uMomentum.value = 0;
    this.material.uniforms.uAnimation.value = 0;
    this.material.uniforms.uReturning.value = 0;
    this.bloomPass.strength = this.settings.bloomStrength;
    this.bloomPass.threshold = 0.2;
    this.particles.visible = true;
  }

  transition() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.particles.visible = true;
    this.material.uniforms.uAnimation.value = 0;
    this.material.uniforms.uReturning.value = 0;

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.isTransitioning = false;
        this.material.uniforms.uProgress.value = 0;
        this.material.uniforms.uMomentum.value = 0;
        this.material.uniforms.uAnimation.value = 0;
        this.material.uniforms.uReturning.value = 0;
      },
    });
    this.timeline.addLabel('contact');
    this.timeline.to({}, { duration: this.settings.contactPause }, 'contact');
    this.timeline.addLabel('explode');
    this.timeline.to(this.material.uniforms.uAnimation, {
      value: 1,
      duration: 0.24,
      ease: 'power2.out',
    }, 'explode');
    this.timeline.to(this.material.uniforms.uProgress, {
      value: 1,
      duration: this.settings.explosionDuration,
      ease: 'power2.in',
    }, 'explode');
    this.timeline.to(this.material.uniforms.uMomentum, {
      value: 1.25,
      duration: this.settings.explosionDuration * 0.42,
      ease: 'power3.out',
    }, 'explode+=0.08');
    this.timeline.to(this.material.uniforms.uMomentum, {
      value: 0.28,
      duration: this.settings.explosionDuration * 0.58,
      ease: 'power2.out',
    }, 'explode+=0.42');
    this.timeline.to(this.bloomPass, {
      strength: Math.max(2.8, this.settings.bloomStrength * 18),
      duration: 0.22,
      ease: 'power4.out',
    }, 'explode+=0.72');
    this.timeline.to(this.bloomPass, {
      threshold: 0.05,
      duration: 0.18,
      ease: 'power2.out',
    }, 'explode+=0.72');
    this.timeline.addLabel('hold', `explode+=${this.settings.explosionDuration + this.settings.explosionHold}`);
    this.timeline.call(() => {
      this.material.uniforms.uReturning.value = 1;
    }, [], 'hold');
    this.timeline.to(this.material.uniforms.uProgress, {
      value: 0,
      duration: this.settings.returnDuration,
      ease: 'power2.inOut',
    }, 'hold');
    this.timeline.to(this.material.uniforms.uMomentum, {
      value: 0,
      duration: this.settings.returnDuration * 0.72,
      ease: 'power3.out',
    }, 'hold');
    this.timeline.to(this.material.uniforms.uAnimation, {
      value: 0,
      duration: this.settings.returnDuration,
      ease: 'power2.in',
    }, 'hold');
    this.timeline.to(this.bloomPass, {
      strength: this.settings.bloomStrength,
      duration: this.settings.returnDuration,
      ease: 'power2.out',
    }, 'hold');
    this.timeline.to(this.bloomPass, {
      threshold: 0.2,
      duration: this.settings.returnDuration,
      ease: 'power2.out',
    }, 'hold');
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.stats.begin();
    this.time += 0.016;
    this.material.uniforms.uTime.value = this.time;
    this.controls.update();
    this.composer.render();
    this.stats.end();
    requestAnimationFrame(() => this.render());
  }
}

function createExperimentalPage() {
  document.body.classList.add('video-particles-study');
  document.body.innerHTML = `
    <main>
      <div id="webgl"></div>
      <section class="video-particles-copy" aria-label="Experiment notes">
        <h1>Video into Particles 2 <span>(tests)</span></h1>
        <p>Particle-mesh study using the recovered end frames. Choose a reference in the controls, then inspect its explode / recompute pass.</p>
      </section>
      <footer class="video-particles-footer">
        <a href="/index.html">‹ back to homepage</a>
      </footer>
    </main>
  `;
  installStyles();
  const loading = document.createElement('aside');
  loading.id = 'loading';
  loading.innerHTML = '<h1>Loading...</h1>';
  document.body.appendChild(loading);

  new VideoParticlesScene(document.getElementById('webgl'));
  window.addEventListener('load', () => { loading.style.display = 'none'; });
}

function createPage() {
  if (window.__VIDEO_PARTICLES_EXPERIMENTAL__) {
    createExperimentalPage();
    return;
  }
  createReplicaPage();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', createPage);
} else {
  createPage();
}
