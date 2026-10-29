import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import * as dat from 'dat.gui';
import gsap from 'gsap';
import Stats from 'stats.js';

import '../../styles/global.scss';
import vertex from '../../shader/videoParticlesReplicaVertex.glsl';
import fragment from '../../shader/videoParticlesReplicaFragment.glsl';

const IMAGE_ASPECT = 480 / 820;

function installStyles() {
  const style = document.createElement('style');
  style.textContent = `
    body.video-particles-replica { overflow: hidden; background: #02080d; }
    body.video-particles-replica #webgl {
      position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 0;
    }
    body.video-particles-replica video { display: none; }
    body.video-particles-replica .video-particles-copy {
      position: fixed; left: 8%; bottom: 5.4rem; z-index: 2;
      max-width: min(38rem, 52vw); color: rgba(255,255,255,0.86);
      pointer-events: none;
    }
    body.video-particles-replica .video-particles-copy h1 {
      margin: 0 0 0.6rem; font-size: clamp(1.4rem, 2.8vw, 2.35rem);
      font-weight: 400; letter-spacing: 0.04em;
    }
    body.video-particles-replica .video-particles-copy p {
      margin: 0; color: rgba(255,255,255,0.58); font-size: 0.86rem; line-height: 1.5;
    }
    body.video-particles-replica .video-particles-footer {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 3;
      display: flex; align-items: center; padding: 1rem 8% 1.2rem;
      background: linear-gradient(180deg, rgba(2,8,13,0), rgba(2,8,13,0.9));
      pointer-events: none;
    }
    body.video-particles-replica .video-particles-footer a {
      color: rgba(255,255,255,0.78); font-size: 0.82rem; line-height: 1.2;
      pointer-events: auto;
    }
    body.video-particles-replica .video-particles-stats {
      z-index: 60 !important; top: 0.5rem !important; bottom: auto !important; left: 0.5rem !important;
    }
    @media (max-width: 975px) {
      body.video-particles-replica .dg.main {
        position: fixed !important; top: 0.5rem !important; bottom: auto !important; right: 0 !important;
        width: min(280px, calc(100vw - 0.75rem)) !important; max-width: calc(100vw - 0.75rem);
        z-index: 50 !important; max-height: 45vh; overflow-y: auto;
      }
      body.video-particles-replica .video-particles-copy {
        left: 1.5rem; right: 1.5rem; bottom: 5.3rem; max-width: none;
      }
      body.video-particles-replica .video-particles-footer { padding: 0.95rem 1.5rem 1.15rem; }
    }
  `;
  document.head.appendChild(style);
}

class ReplicaScene {
  constructor(container) {
    this.container = container;
    this.width = container.offsetWidth;
    this.height = container.offsetHeight;
    this.clock = new THREE.Clock();
    this.time = 0;
    this.isTransitioning = false;
    this.activeVideo = 'a';

    this.scene = new THREE.Scene();
    // Keep the reference scene's world scale. The curl-noise coordinates were
    // authored for an 837.6 x 1430.9 plane viewed from roughly z=1500; using
    // the small normalized test plane makes the field almost uniform.
    this.camera = new THREE.PerspectiveCamera(70, this.width / this.height, 0.001, 5000);
    this.camera.position.set(0, 0, 1500);

    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x02080d, 1);
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 350;
    this.controls.maxDistance = 4500;
    this.controls.update();

    this.renderPass = new RenderPass(this.scene, this.camera);
    this.bloomPass = new UnrealBloomPass(
      new THREE.Vector2(Math.max(1, this.width * 0.5), Math.max(1, this.height * 0.5)),
      0,
      0.55,
      0.85,
    );
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(this.renderPass);
    this.composer.addPass(this.bloomPass);

    this.settings = {
      distortion: 0,
      bloomStrength: 0,
      // A short, soft bloom veil makes the pink -> blue colour jump less
      // readable while the particles are crossing over.
      transitionBloom: 9,
      particleSize: 2,
      transitionDuration: 2,
      textureDelay: 1.5,
      textureDuration: 1,
      // Start the next video while the particles are still settling. This
      // avoids holding its first frame until the very last bloom frame.
      videoLead: 0.55,
    };

    this.videoA = document.getElementById('video-a');
    this.videoB = document.getElementById('video-b');
    this.videoA.muted = true;
    this.videoB.muted = true;
    this.videoA.loop = false;
    this.videoB.loop = false;

    this.createParticles();
    this.setupGui();
    this.setupStats();
    this.setupVideoCycle();
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.render();
  }

  createParticles() {
    const geometry = new THREE.PlaneBufferGeometry(
      480 * 1.745,
      820 * 1.745,
      240,
      410,
    );
    this.textureA = new THREE.VideoTexture(this.videoA);
    this.textureB = new THREE.VideoTexture(this.videoB);
    [this.textureA, this.textureB].forEach((texture) => {
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
    });
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uDistortion: { value: 0 },
        uPointSize: { value: this.settings.particleSize },
        uProgress: { value: 0 },
        uTextureA: { value: this.textureA },
        uTextureB: { value: this.textureB },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      depthWrite: false,
    });
    this.particles = new THREE.Points(geometry, this.material);
    this.particles.position.z = 0;
    this.scene.add(this.particles);
  }

  setupGui() {
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'distortion', 0, 3, 0.01)
      .onChange((value) => { this.material.uniforms.uDistortion.value = value; });
    this.gui.add(this.settings, 'bloomStrength', 0, 7, 0.01)
      .onChange((value) => { this.bloomPass.strength = value; });
    this.gui.add(this.settings, 'transitionBloom', 0, 14, 0.1)
      .name('Transition bloom');
    this.gui.add(this.settings, 'particleSize', 0.5, 6, 0.05)
      .onChange((value) => { this.material.uniforms.uPointSize.value = value; });
    this.gui.add(this.settings, 'transitionDuration', 1, 4, 0.05);
    this.gui.add(this.settings, 'textureDelay', 0, 3, 0.05);
    this.gui.add(this.settings, 'textureDuration', 0.25, 2, 0.05);
    this.gui.add(this.settings, 'videoLead', 0, 1.5, 0.05)
      .name('Video lead (sec)');
    this.gui.add({ playA: () => this.playVideo('a') }, 'playA').name('Play video A');
    this.gui.add({ playB: () => this.playVideo('b') }, 'playB').name('Play video B');
    this.gui.add({ transition: () => this.transition(this.activeVideo) }, 'transition').name('Trigger transition');
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

  setupVideoCycle() {
    this.videoA.addEventListener('ended', () => this.transition('a'));
    this.videoB.addEventListener('ended', () => this.transition('b'));
    this.playVideo('a');
  }

  // Seeking a hidden video is asynchronous. Starting the particle mix before
  // the target frame has actually been decoded leaves the old texture in the
  // GPU for a few frames, which reads as a hard flash (especially A -> B).
  prepareVideoFrame(video) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        video.removeEventListener('seeked', finish);
        resolve();
      };

      video.addEventListener('seeked', finish, { once: true });
      try {
        video.currentTime = 0;
      } catch (error) {
        finish();
        return;
      }

      // Browsers do not emit `seeked` when the video was already on frame 0.
      // Give VideoTexture two render frames to upload that frame instead.
      if (video.readyState >= 2 && video.currentTime < 0.01) {
        requestAnimationFrame(() => requestAnimationFrame(finish));
      }
      setTimeout(finish, 180);
    });
  }

  playVideo(name) {
    if (this.isTransitioning) {
      this.timeline?.kill();
      this.isTransitioning = false;
    }
    const video = name === 'a' ? this.videoA : this.videoB;
    const other = name === 'a' ? this.videoB : this.videoA;
    other.pause();
    video.currentTime = 0;
    this.activeVideo = name;
    this.material.uniforms.uDistortion.value = 0;
    this.material.uniforms.uProgress.value = 0;
    this.bloomPass.strength = 0;
    this.bloomPass.threshold = 0.85;
    video.play().catch(() => {});
  }

  async transition(from) {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    const source = from === 'a' ? this.videoA : this.videoB;
    const target = from === 'a' ? this.videoB : this.videoA;
    const sourceTexture = from === 'a' ? this.textureA : this.textureB;
    const targetTexture = from === 'a' ? this.textureB : this.textureA;
    source.pause();
    target.pause();
    await this.prepareVideoFrame(target);
    this.material.uniforms.uTextureA.value = sourceTexture;
    this.material.uniforms.uTextureB.value = targetTexture;
    this.material.uniforms.uProgress.value = 0;
    this.material.uniforms.uDistortion.value = 0;
    this.bloomPass.strength = 0;
    this.bloomPass.threshold = 0.85;

    this.timeline = gsap.timeline({
      onComplete: () => {
        this.isTransitioning = false;
        this.activeVideo = from === 'a' ? 'b' : 'a';
        // The next frame starts with the target as the primary texture. This
        // keeps the first rendered frame of the new video seamless after the
        // particle mix is reset to zero.
        this.material.uniforms.uTextureA.value = targetTexture;
        this.material.uniforms.uTextureB.value = sourceTexture;
        this.material.uniforms.uDistortion.value = 0;
        this.material.uniforms.uProgress.value = 0;
        this.bloomPass.strength = 0;
        // The target is already playing slightly before the particles finish
        // settling; do not rewind it here and expose a visible first-frame cut.
        if (target.paused) target.play().catch(() => {});
      },
    });
    this.timeline.to(this.material.uniforms.uDistortion, {
      value: 3,
      duration: this.settings.transitionDuration,
      ease: 'power2.inOut',
    }, 0);
    this.timeline.to(this.material.uniforms.uProgress, {
      value: 1,
      duration: this.settings.textureDuration,
      delay: this.settings.textureDelay,
      ease: 'power2.inOut',
    }, 0);
    this.timeline.to(this.bloomPass, {
      strength: this.settings.transitionBloom,
      duration: this.settings.transitionDuration,
      ease: 'power2.in',
    }, 0);
    this.timeline.to(this.bloomPass, {
      threshold: 0.12,
      duration: 0.22,
      ease: 'power2.out',
    }, 0);
    this.timeline.to(this.material.uniforms.uDistortion, {
      value: 0,
      duration: this.settings.transitionDuration,
      delay: this.settings.transitionDuration,
      ease: 'power2.inOut',
    }, 0);
    this.timeline.to(this.bloomPass, {
      strength: 0,
      duration: this.settings.transitionDuration,
      // Keep a small veil after the A -> B mix. Without this hold the pink
      // and blue frames become readable as a hard cut just as the particles
      // begin to settle.
      delay: this.settings.textureDelay + this.settings.textureDuration + 0.42,
      ease: 'power2.out',
    }, 0);
    this.timeline.to(this.bloomPass, {
      threshold: 0.85,
      duration: 0.5,
      delay: this.settings.textureDelay + this.settings.textureDuration + 0.42,
      ease: 'power2.in',
    }, 0);

    const videoStart = this.settings.textureDelay
      + this.settings.textureDuration
      + this.settings.videoLead;
    this.timeline.call(() => {
      target.play().catch(() => {});
    }, [], videoStart);
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    // Keep bloom's internal pyramid at half resolution; the particle pass
    // remains full size, while the expensive blur becomes substantially cheaper.
    this.bloomPass.setSize(
      Math.max(1, this.width * 0.5),
      Math.max(1, this.height * 0.5),
    );
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  render() {
    this.stats.begin();
    this.time += this.clock.getDelta();
    this.material.uniforms.uTime.value = this.time;
    this.controls.update();
    this.composer.render();
    this.stats.end();
    requestAnimationFrame(() => this.render());
  }
}

export default function createReplicaPage() {
  document.body.classList.add('video-particles-replica');
  document.body.innerHTML = `
    <main>
      <div id="webgl"></div>
      <section class="video-particles-copy" aria-label="Experiment notes">
        <h1>Video into Particles</h1>
        <p>Replica study: video A reaches its end frame, dissolves through curl noise, then recomposes into video B.</p>
      </section>
      <footer class="video-particles-footer">
        <a href="/index.html">‹ back to homepage</a>
      </footer>
      <video id="video-a" src="/video/a.mp4" muted playsinline preload="auto" aria-hidden="true"></video>
      <video id="video-b" src="/video/b.mp4" muted playsinline preload="auto" aria-hidden="true"></video>
    </main>
  `;
  installStyles();
  const loading = document.createElement('aside');
  loading.id = 'loading';
  loading.innerHTML = '<h1>Loading...</h1>';
  document.body.appendChild(loading);
  new ReplicaScene(document.getElementById('webgl'));
  window.addEventListener('load', () => { loading.style.display = 'none'; });
}
