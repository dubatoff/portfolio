import { gsap } from "./public/vendor/gsap-esm/index.js";
import { ScrollTrigger } from "./public/vendor/gsap-esm/ScrollTrigger.js";
import * as THREE from "three";
import { GLTFLoader } from "./public/vendor/GLTFLoader.js";
import { RoomEnvironment } from "./public/vendor/RoomEnvironment.js";

const section = document.getElementById("logoTransition");
const canvas = document.getElementById("logoTransitionCanvas");
const loading = document.getElementById("logoTransitionLoading");
const portal = document.getElementById("logoTransitionPortal");
const contact = document.getElementById("contactPanel");
const contactContent = contact?.querySelector(".contact__content");
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
  renderer.setPixelRatio(Math.min(1, window.devicePixelRatio || 1));
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
  const parallaxRoot = new THREE.Group();
  modelRoot.add(parallaxRoot);

  let model = null;
  let modelBoundsCorners = [];
  let baseScale = 1;
  let scrollProgress = 0;
  let renderedProgress = 0;
  let modelReady = false;
  let fireworksActive = false;
  let finaleLaunched = false;
  let ambientFireworksStarted = false;
  let fireworksStopAt = 0;
  let transitionVisible = false;
  let modelFrameDirty = true;
  let lastWebGLRender = 0;
  const webGLFrameInterval = 1000 / 60;
  const pointerTarget = new THREE.Vector2();
  const pointerCurrent = new THREE.Vector2();

  function resizeRenderer() {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(1, window.devicePixelRatio || 1));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    modelFrameDirty = true;
  }

  function smoothstep(min, max, value) {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return normalized * normalized * (3 - 2 * normalized);
  }

  function centerMobileModelInViewport(correctionWeight = 1) {
    if (
      correctionWeight <= 0 ||
      !window.matchMedia("(max-width: 760px)").matches ||
      !modelBoundsCorners.length
    ) return;

    modelRoot.updateMatrixWorld(true);
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    modelBoundsCorners.forEach((corner) => {
      const projected = corner
        .clone()
        .applyMatrix4(modelRoot.matrixWorld)
        .project(camera);
      minX = Math.min(minX, projected.x);
      maxX = Math.max(maxX, projected.x);
      minY = Math.min(minY, projected.y);
      maxY = Math.max(maxY, projected.y);
    });

    const projectedCenterX = (minX + maxX) * 0.5;
    const projectedCenterY = (minY + maxY) * 0.5;
    const projectedRoot = new THREE.Vector3()
      .setFromMatrixPosition(modelRoot.matrixWorld)
      .project(camera);
    const viewportCenter = new THREE.Vector3(0, 0, projectedRoot.z).unproject(camera);
    const correctedCenter = new THREE.Vector3(
      -projectedCenterX,
      -projectedCenterY,
      projectedRoot.z,
    ).unproject(camera);

    modelRoot.position.x += (correctedCenter.x - viewportCenter.x) * correctionWeight;
    modelRoot.position.y += (correctedCenter.y - viewportCenter.y) * correctionWeight;
  }

  function alignContactAnchor() {
    if (window.location.hash !== "#contact") return;
    const sectionTop = window.scrollY + section.getBoundingClientRect().top;
    window.scrollTo({
      top: sectionTop + section.offsetHeight - window.innerHeight,
      behavior: "auto",
    });
  }

  function applyProgress(progress) {
    if (!modelReady || !model) return;

    const rotationPhase = smoothstep(0.02, 0.62, progress);
    const approachPhase = smoothstep(0.38, 0.76, progress);
    const finalRush = Math.pow(approachPhase, 2.25);
    const fullCoverPhase = smoothstep(0.76, 0.93, progress);
    const scaleMultiplier =
      1 + rotationPhase * 0.34 + finalRush * 3.8 + fullCoverPhase * 4;

    modelRoot.scale.setScalar(baseScale * scaleMultiplier);
    modelRoot.rotation.x = -0.115 + Math.sin(rotationPhase * Math.PI) * 0.08;
    modelRoot.rotation.y = -0.23 + rotationPhase * Math.PI * 2;
    modelRoot.rotation.z = -0.045 + rotationPhase * 0.05;
    const isMobileLayout = window.matchMedia("(max-width: 760px)").matches;
    modelRoot.position.x = isMobileLayout ? -0.06 * finalRush : 0;
    modelRoot.position.y = 0.03 - finalRush * 0.03;

    const darkScreenPhase = smoothstep(0.94, 0.97, progress);
    portal.style.opacity = String(darkScreenPhase);
    section.classList.toggle("is-portal-open", darkScreenPhase > 0.01);

    const canvasFade = 1 - smoothstep(0.925, 0.96, progress);
    canvas.style.opacity = String(canvasFade);

    const contentPhase = scrollProgress >= 0.98 ? smoothstep(0.98, 0.997, progress) : 0;
    if (contactContent) {
      contactContent.style.opacity = String(contentPhase);
      contactContent.style.transform = `translateY(${(1 - contentPhase) * 44}px) scale(${0.985 + contentPhase * 0.015})`;
      contactContent.style.pointerEvents = contentPhase > 0.96 ? "auto" : "none";
    }
    contact.classList.toggle("show-contact", contentPhase > 0.01);

    if (scrollProgress >= 0.965 && progress >= 0.965 && !finaleLaunched) {
      finaleLaunched = true;
      launchFinale();
    } else if ((scrollProgress < 0.86 || progress < 0.82) && finaleLaunched) {
      finaleLaunched = false;
      ambientFireworksStarted = false;
      fireworksActive = false;
      particles.length = 0;
    }
    if (
      scrollProgress >= 0.98 &&
      progress >= 0.98 &&
      finaleLaunched &&
      !ambientFireworksStarted
    ) {
      ambientFireworksStarted = true;
      fireworksStopAt = performance.now() + 4400;
      createBurst(0.95);
      lastBurst = performance.now();
    }
    fireworksActive =
      ambientFireworksStarted &&
      progress >= 0.98 &&
      progress < 0.995 &&
      performance.now() < fireworksStopAt;
  }

  const loader = new GLTFLoader();
  loader.load(
    "./public/assets/dubatoff-logo-3d.gltf",
    (gltf) => {
      model = gltf.scene;
      parallaxRoot.add(model);

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
      model.updateMatrixWorld(true);
      const centeredBounds = new THREE.Box3().setFromObject(model);
      const { min, max } = centeredBounds;
      modelBoundsCorners = [
        new THREE.Vector3(min.x, min.y, min.z),
        new THREE.Vector3(min.x, min.y, max.z),
        new THREE.Vector3(min.x, max.y, min.z),
        new THREE.Vector3(min.x, max.y, max.z),
        new THREE.Vector3(max.x, min.y, min.z),
        new THREE.Vector3(max.x, min.y, max.z),
        new THREE.Vector3(max.x, max.y, min.z),
        new THREE.Vector3(max.x, max.y, max.z),
      ];
      const mobileScale = window.matchMedia("(max-width: 760px)").matches ? 1.72 : 2.15;
      baseScale = mobileScale / Math.max(0.001, size.x);

      modelReady = true;
      scrollProgress = transitionTrigger.progress;
      renderedProgress = scrollProgress;
      applyProgress(renderedProgress);
      renderer.compile(scene, camera);
      renderer.render(scene, camera);
      modelFrameDirty = true;
      section.classList.add("is-model-ready");
      ScrollTrigger.refresh();
      alignContactAnchor();
      ScrollTrigger.update();
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

  const transitionTrigger = ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      scrollProgress = reduceMotion ? (self.progress > 0.25 ? 1 : 0) : self.progress;
      modelFrameDirty = true;
    },
  });

  function render(time = 0) {
    if (!transitionVisible || document.hidden) {
      requestAnimationFrame(render);
      return;
    }
    const isMobileLayout = window.matchMedia("(max-width: 760px)").matches;
    const progressDelta = Math.abs(scrollProgress - renderedProgress);
    const pointerDelta = pointerCurrent.distanceTo(pointerTarget);
    if (isMobileLayout && !reduceMotion) {
      renderedProgress += (scrollProgress - renderedProgress) * 0.2;
      if (Math.abs(scrollProgress - renderedProgress) < 0.0001) {
        renderedProgress = scrollProgress;
      }
    } else {
      renderedProgress = scrollProgress;
    }
    pointerCurrent.lerp(pointerTarget, reduceMotion ? 1 : 0.12);
    parallaxRoot.rotation.x = pointerCurrent.y * -0.11;
    parallaxRoot.rotation.y = pointerCurrent.x * 0.15;
    parallaxRoot.position.x = pointerCurrent.x * 0.12;
    parallaxRoot.position.y = pointerCurrent.y * -0.08;
    applyProgress(renderedProgress);
    const modelIsVisible = renderedProgress < 0.965;
    const modelIsMoving = progressDelta > 0.00025 || pointerDelta > 0.00025;
    if (
      modelIsVisible &&
      (modelFrameDirty || modelIsMoving) &&
      time - lastWebGLRender >= webGLFrameInterval
    ) {
      renderer.render(scene, camera);
      lastWebGLRender = time;
      modelFrameDirty = modelIsMoving;
    }
    requestAnimationFrame(render);
  }

  resizeRenderer();
  window.addEventListener("resize", () => {
    resizeRenderer();
    ScrollTrigger.refresh();
  });
  window.addEventListener("hashchange", () => {
    window.requestAnimationFrame(() => {
      alignContactAnchor();
      ScrollTrigger.update();
    });
  });
  function updateTransitionVisibility() {
    const rect = section.getBoundingClientRect();
    transitionVisible = rect.bottom > 0 && rect.top < window.innerHeight;
  }
  window.addEventListener("scroll", updateTransitionVisibility, { passive: true });
  updateTransitionVisibility();
  window.addEventListener("pointermove", (event) => {
    if (window.matchMedia("(max-width: 760px)").matches) {
      pointerTarget.set(0, 0);
      return;
    }
    pointerTarget.set(
      THREE.MathUtils.clamp((event.clientX / window.innerWidth) * 2 - 1, -1, 1),
      THREE.MathUtils.clamp((event.clientY / window.innerHeight) * 2 - 1, -1, 1),
    );
    modelFrameDirty = true;
  });
  document.documentElement.addEventListener("mouseleave", () => pointerTarget.set(0, 0));
  render();

  const fireworksContext = fireworksCanvas?.getContext("2d");
  const particles = [];
  let fireworksWidth = 0;
  let fireworksHeight = 0;
  let fireworksDpr = 1;
  let lastBurst = 0;

  function resizeFireworks() {
    if (!fireworksCanvas || !fireworksContext) return;
    const rect = fireworksCanvas.getBoundingClientRect();
    fireworksWidth = Math.max(1, rect.width);
    fireworksHeight = Math.max(1, rect.height);
    fireworksDpr = Math.min(1.15, window.devicePixelRatio || 1);
    fireworksCanvas.width = Math.round(fireworksWidth * fireworksDpr);
    fireworksCanvas.height = Math.round(fireworksHeight * fireworksDpr);
    fireworksContext.setTransform(fireworksDpr, 0, 0, fireworksDpr, 0, 0);
  }

  function createBurst(size = 1, originRatioX = null, originRatioY = null, density = 1) {
    const originX = fireworksWidth * (originRatioX ?? (0.12 + Math.random() * 0.76));
    const originY = fireworksHeight * (originRatioY ?? (0.12 + Math.random() * 0.42));
    const count = Math.round((64 + Math.random() * 26) * Math.sqrt(size) * density);
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count + Math.random() * 0.08;
      const speed = (1.9 + Math.random() * 4.8) * size;
      particles.push({
        x: originX,
        y: originY,
        previousX: originX,
        previousY: originY,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: 1,
        decay: 0.007 + Math.random() * (0.009 / Math.max(1, size)),
        width: 1 + Math.random() * 1.6 * size,
      });
    }
  }

  function launchFinale() {
    resizeFireworks();
    createBurst(3.6, 0.5, 0.46, 1.15);
    window.setTimeout(() => {
      if (finaleLaunched && scrollProgress >= 0.8) createBurst(3.1, 0.22, 0.3, 0.95);
    }, 190);
    window.setTimeout(() => {
      if (finaleLaunched && scrollProgress >= 0.8) createBurst(2.85, 0.78, 0.32, 0.9);
    }, 380);
  }

  function animateFireworks(time) {
    if (!fireworksContext) return;
    if ((!fireworksActive && particles.length === 0) || document.hidden) {
      requestAnimationFrame(animateFireworks);
      return;
    }
    fireworksContext.clearRect(0, 0, fireworksWidth, fireworksHeight);

    if (fireworksActive && time - lastBurst > 820 + Math.random() * 500) {
      createBurst(0.95);
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

  window.addEventListener("resize", resizeFireworks);
  resizeFireworks();
  requestAnimationFrame(animateFireworks);
}
