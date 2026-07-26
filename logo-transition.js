import { gsap } from "./public/vendor/gsap-esm/index.js";
import { ScrollTrigger } from "./public/vendor/gsap-esm/ScrollTrigger.js";
import * as THREE from "three";
import { GLTFLoader } from "./public/vendor/GLTFLoader.js";
import { RoomEnvironment } from "./public/vendor/RoomEnvironment.js";

const section = document.getElementById("logoTransition");
const canvas = document.getElementById("logoTransitionCanvas");
const loading = document.getElementById("logoTransitionLoading");
const portal = document.getElementById("logoTransitionPortal");
const portalContent = portal?.querySelector(".logo-transition__portal-content");
const contact = document.getElementById("contact");
const fireworksCanvas = document.getElementById("fireworks");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (section && canvas && portal && contact) {
  gsap.registerPlugin(ScrollTrigger);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
  camera.position.set(0, 0.08, 8);

  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(environment, 0.05).texture;
  environment.dispose();
  pmrem.dispose();

  const coolLight = new THREE.DirectionalLight(0x526cff, 7.5);
  coolLight.position.set(-4.5, 4, 6);
  scene.add(coolLight);

  const warmLight = new THREE.DirectionalLight(0xffb29b, 5.2);
  warmLight.position.set(5, -2.5, 5);
  scene.add(warmLight);

  const rimLight = new THREE.DirectionalLight(0x8b79ff, 4.2);
  rimLight.position.set(0, 2, -5);
  scene.add(rimLight);
  scene.add(new THREE.AmbientLight(0xb6b8e8, 1.15));

  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  let model = null;
  let baseScale = 1;
  let scrollProgress = 0;
  let renderedProgress = 0;
  let modelReady = false;

  function resizeRenderer() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  function smoothstep(min, max, value) {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return normalized * normalized * (3 - 2 * normalized);
  }

  function applyProgress(progress) {
    if (!modelReady || !model) return;

    const rotationPhase = smoothstep(0.02, 0.7, progress);
    const approachPhase = smoothstep(0.5, 0.98, progress);
    const finalRush = Math.pow(approachPhase, 2.25);
    const scaleMultiplier = 1 + rotationPhase * 0.34 + finalRush * 14.5;

    modelRoot.scale.setScalar(baseScale * scaleMultiplier);
    modelRoot.rotation.x = -0.115 + Math.sin(rotationPhase * Math.PI) * 0.08;
    modelRoot.rotation.y = -0.23 + rotationPhase * 0.34 + finalRush * 0.12;
    modelRoot.rotation.z = -0.045 + rotationPhase * 0.05;
    modelRoot.position.y = 0.03 - finalRush * 0.03;

    const portalPhase = smoothstep(0.79, 0.985, progress);
    const portalRadius = portalPhase * 145;
    portal.style.clipPath = `circle(${portalRadius}% at 50% 50%)`;
    section.classList.toggle("is-portal-open", portalPhase > 0.48);

    if (portalContent) {
      const contentPhase = smoothstep(0.88, 0.99, progress);
      portalContent.style.opacity = String(contentPhase);
      portalContent.style.transform = `translateY(${(1 - contentPhase) * 35}px)`;
    }

    const canvasFade = 1 - smoothstep(0.91, 0.995, progress);
    canvas.style.opacity = String(canvasFade);
  }

  const loader = new GLTFLoader();
  loader.load(
    "./public/assets/dubatoff-logo-3d.gltf",
    (gltf) => {
      model = gltf.scene;
      modelRoot.add(model);

      model.traverse((object) => {
        if (!object.isMesh) return;
        object.frustumCulled = false;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          if (!material) return;
          material.transparent = true;
          material.opacity = Math.min(material.opacity ?? 1, 0.82);
          material.depthWrite = true;
          material.side = THREE.DoubleSide;
          if ("metalness" in material) material.metalness = 0.92;
          if ("roughness" in material) material.roughness = 0.16;
          if ("envMapIntensity" in material) material.envMapIntensity = 2.35;
          material.needsUpdate = true;
        });
      });

      const bounds = new THREE.Box3().setFromObject(model);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      model.position.sub(center);
      baseScale = 2.15 / Math.max(0.001, size.x);

      modelReady = true;
      section.classList.add("is-model-ready");
      applyProgress(scrollProgress);
    },
    (event) => {
      if (!loading || !event.total) return;
      const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
      loading.textContent = `LOADING 3D / ${String(percent).padStart(2, "0")}%`;
    },
    () => {
      if (loading) loading.textContent = "3D MODEL / LOAD ERROR";
    },
  );

  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: reduceMotion ? false : 0.8,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      scrollProgress = reduceMotion ? (self.progress > 0.25 ? 1 : 0) : self.progress;
    },
  });

  function render() {
    renderedProgress += (scrollProgress - renderedProgress) * (reduceMotion ? 1 : 0.075);
    applyProgress(renderedProgress);
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  }

  resizeRenderer();
  window.addEventListener("resize", () => {
    resizeRenderer();
    ScrollTrigger.refresh();
  });
  render();

  const fireworksContext = fireworksCanvas?.getContext("2d");
  const particles = [];
  let fireworksActive = false;
  let fireworksWidth = 0;
  let fireworksHeight = 0;
  let fireworksDpr = 1;
  let lastBurst = 0;

  function resizeFireworks() {
    if (!fireworksCanvas || !fireworksContext) return;
    const rect = fireworksCanvas.getBoundingClientRect();
    fireworksWidth = Math.max(1, rect.width);
    fireworksHeight = Math.max(1, rect.height);
    fireworksDpr = Math.min(2, window.devicePixelRatio || 1);
    fireworksCanvas.width = Math.round(fireworksWidth * fireworksDpr);
    fireworksCanvas.height = Math.round(fireworksHeight * fireworksDpr);
    fireworksContext.setTransform(fireworksDpr, 0, 0, fireworksDpr, 0, 0);
  }

  function createBurst() {
    const originX = fireworksWidth * (0.15 + Math.random() * 0.7);
    const originY = fireworksHeight * (0.14 + Math.random() * 0.45);
    const count = 58 + Math.floor(Math.random() * 28);
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.08;
      const speed = 1.6 + Math.random() * 4.2;
      particles.push({
        x: originX,
        y: originY,
        previousX: originX,
        previousY: originY,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 1,
        decay: 0.012 + Math.random() * 0.012,
        width: 0.7 + Math.random() * 1.7,
      });
    }
  }

  function animateFireworks(time) {
    if (!fireworksContext) return;
    fireworksContext.clearRect(0, 0, fireworksWidth, fireworksHeight);

    if (fireworksActive && time - lastBurst > 620 + Math.random() * 420) {
      createBurst();
      lastBurst = time;
    }

    fireworksContext.lineCap = "round";
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.previousX = particle.x;
      particle.previousY = particle.y;
      particle.velocityY += 0.035;
      particle.velocityX *= 0.992;
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.life -= particle.decay;

      if (particle.life <= 0) {
        particles.splice(index, 1);
        continue;
      }

      fireworksContext.globalAlpha = Math.max(0, particle.life);
      fireworksContext.strokeStyle = "#1C32B7";
      fireworksContext.lineWidth = particle.width;
      fireworksContext.beginPath();
      fireworksContext.moveTo(particle.previousX, particle.previousY);
      fireworksContext.lineTo(particle.x, particle.y);
      fireworksContext.stroke();
    }
    fireworksContext.globalAlpha = 1;
    requestAnimationFrame(animateFireworks);
  }

  const contactObserver = new IntersectionObserver(
    ([entry]) => {
      fireworksActive = entry.isIntersecting;
      contact.classList.toggle("show-contact", entry.isIntersecting);
      if (entry.isIntersecting) {
        resizeFireworks();
        createBurst();
        window.setTimeout(createBurst, 240);
      }
    },
    { threshold: 0.22 },
  );

  contactObserver.observe(contact);
  window.addEventListener("resize", resizeFireworks);
  resizeFireworks();
  requestAnimationFrame(animateFireworks);
}
