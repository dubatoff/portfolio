(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const body = document.body;
  const loader = document.getElementById("loader");
  const loaderLine = document.getElementById("loaderLine");
  const loaderPercent = document.getElementById("loaderPercent");
  const fixedMark = document.getElementById("fixedMark");
  const fixedLiveStatus = document.getElementById("fixedLiveStatus");
  const contact = document.getElementById("contactPanel");
  const hasLogoTransition = Boolean(document.getElementById("logoTransition"));
  const about = document.getElementById("about");
  const aboutSignature = about?.querySelector(".about__signature");
  const hero = document.getElementById("main");
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuBackdrop = document.querySelector(".mobile-menu-backdrop");
  const aboutMobilePanel = document.querySelector(".about-mobile-panel");
  const aboutMobileToggle = document.querySelector(".about-mobile-switch__toggle");
  const qaMode = new URLSearchParams(window.location.search).has("qa");
  let heroVisible = true;

  body.classList.add("is-loading");
  body.classList.add("native-cursor");

  function setMobileMenu(open) {
    if (!mobileMenuToggle || !mobileMenu || !mobileMenuBackdrop) return;
    mobileMenuToggle.setAttribute("aria-expanded", String(open));
    mobileMenuToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    mobileMenu.setAttribute("aria-hidden", String(!open));
    mobileMenu.classList.toggle("is-open", open);
    mobileMenuBackdrop.classList.toggle("is-open", open);
  }

  mobileMenuToggle?.addEventListener("click", () => {
    setMobileMenu(mobileMenuToggle.getAttribute("aria-expanded") !== "true");
  });
  mobileMenuBackdrop?.addEventListener("click", () => setMobileMenu(false));
  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMobileMenu(false));
  });

  function setAboutMobileMode(mode) {
    if (!aboutMobilePanel || !aboutMobileToggle) return;
    const nextMode = mode === "stack" ? "stack" : "about";
    aboutMobilePanel.dataset.aboutMode = nextMode;
    aboutMobileToggle.setAttribute("aria-pressed", String(nextMode === "stack"));
    aboutMobileToggle.setAttribute("aria-label", nextMode === "stack" ? "Показать ABOUT" : "Показать STACK");
    aboutMobilePanel.querySelectorAll("[data-about-label]").forEach((label) => {
      label.classList.toggle("is-active", label.dataset.aboutLabel === nextMode);
    });
    aboutMobilePanel.querySelectorAll("[data-about-page]").forEach((page) => {
      page.classList.toggle("is-active", page.dataset.aboutPage === nextMode);
    });
  }

  aboutMobileToggle?.addEventListener("click", () => {
    setAboutMobileMode(aboutMobilePanel?.dataset.aboutMode === "about" ? "stack" : "about");
  });

  function runLoader() {
    const start = performance.now();
    const duration = reduceMotion ? 250 : 2100;

    function tick(now) {
      const raw = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - raw, 3);
      const value = Math.min(100, Math.round(eased * 100));
      loaderLine.style.width = `${value}%`;
      loaderPercent.textContent = String(value).padStart(3, "0");
      if (raw < 1) {
        requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => {
          loader.classList.add("is-finished");
          body.classList.remove("is-loading");
          hero.classList.add("hero-ready");
        }, reduceMotion ? 0 : 220);
      }
    }

    requestAnimationFrame(tick);
  }

  if (qaMode) {
    body.classList.add("qa-mode");
    document.documentElement.style.scrollBehavior = "auto";
    loader.classList.add("is-finished");
    body.classList.remove("is-loading");
    hero.classList.add("hero-ready");
    document.querySelectorAll(".work-card, .about__portrait, .about__copy, .about__signature").forEach((element) => element.classList.add("is-visible"));
    if (window.location.hash) {
      window.setTimeout(() => {
        const target = document.querySelector(window.location.hash);
        target?.scrollIntoView({ block: "start" });
      }, 120);
    }
  } else {
    runLoader();
  }

  function buildCodeRain() {
    const layer = document.getElementById("codeRain");
    const assets = [
      { src: "./public/assets/hero-brackets-1.png", width: 116 },
      { src: "./public/assets/hero-brackets-2.png", width: 58 },
      { src: "./public/assets/hero-print-1.png", width: 198 },
      { src: "./public/assets/hero-print-2.png", width: 88 },
    ];
    const starts = [
      [0.03, 0.25, 1], [0.07, 0.36, 3], [0.15, 0.37, 1], [0.25, 0.17, 2],
      [0.29, 0.62, 0], [0.45, 0.78, 3], [0.46, -0.05, 1], [0.51, 0.17, 1],
      [0.64, 0.38, 2], [0.65, 0.71, 0], [0.76, 0.93, 3], [0.84, 0.96, 1],
      [0.95, 0.40, 1], [0.03, 0.56, 1], [0.06, 0.69, 3], [0.46, 0.92, 0],
    ];
    const fragment = document.createDocumentFragment();
    const drops = [];
    const compact = window.innerWidth < 720;

    starts.slice(0, compact ? 8 : 12).forEach((start, index) => {
      const asset = assets[start[2]];
      const drop = document.createElement("img");
      drop.className = "code-drop";
      drop.src = asset.src;
      drop.alt = "";
      drop.draggable = false;
      const scale = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
      const width = asset.width * Math.max(0.68, scale) * (0.88 + Math.random() * 0.24);
      drop.style.setProperty("--drop-width", `${width}px`);
      fragment.appendChild(drop);
      drops.push({
        element: drop,
        x: start[0] * window.innerWidth,
        y: start[1] * window.innerHeight,
        width,
        vx: -9 + Math.random() * 18,
        vy: 21 + Math.random() * 22,
        rotation: -38 + Math.random() * 76,
        vr: -12 + Math.random() * 24,
      });
    });
    layer.appendChild(fragment);

    const pointer = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0 };
    hero.addEventListener("pointermove", (event) => {
      if (pointer.px < -1000) {
        pointer.px = event.clientX;
        pointer.py = event.clientY;
      }
      pointer.vx = event.clientX - pointer.px;
      pointer.vy = event.clientY - pointer.py;
      pointer.px = pointer.x = event.clientX;
      pointer.py = pointer.y = event.clientY;
    });
    hero.addEventListener("pointerleave", () => {
      pointer.x = pointer.y = -9999;
      pointer.vx = pointer.vy = 0;
    });

    let previous = performance.now();
    let lastPhysicsDraw = 0;
    function animate(now) {
      if (!heroVisible || document.hidden || reduceMotion) {
        previous = now;
        requestAnimationFrame(animate);
        return;
      }
      if (now - lastPhysicsDraw < 30) {
        requestAnimationFrame(animate);
        return;
      }
      lastPhysicsDraw = now;
      const dt = Math.min(0.034, (now - previous) / 1000);
      previous = now;
      const width = hero.clientWidth;
      const height = hero.clientHeight;
      drops.forEach((drop) => {
        const centerX = drop.x + drop.width * 0.5;
        const centerY = drop.y + drop.width * 0.35;
        const dx = centerX - pointer.x;
        const dy = centerY - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 165 && distance > 0.1) {
          const force = (1 - distance / 165) * 650;
          drop.vx += (dx / distance) * force * dt + pointer.vx * 1.35;
          drop.vy += (dy / distance) * force * dt + pointer.vy * 1.15;
          drop.vr += (pointer.vx - pointer.vy) * 0.08;
        }
        drop.vy += 10 * dt;
        drop.vx *= Math.pow(0.994, dt * 60);
        drop.vy *= Math.pow(0.998, dt * 60);
        drop.vr *= Math.pow(0.993, dt * 60);
        drop.x += drop.vx * dt;
        drop.y += drop.vy * dt;
        drop.rotation += drop.vr * dt;

        if (drop.y > height + drop.width) {
          drop.y = -drop.width * (1.2 + Math.random() * 2.6);
          drop.x = Math.random() * Math.max(1, width - drop.width);
          drop.vx = -11 + Math.random() * 22;
          drop.vy = 22 + Math.random() * 25;
        }
        if (drop.x < -drop.width * 1.5) drop.x = width + drop.width * 0.25;
        if (drop.x > width + drop.width * 1.5) drop.x = -drop.width * 0.25;
        drop.element.style.transform = `translate3d(${drop.x}px, ${drop.y}px, 0) rotate(${drop.rotation}deg)`;
      });
      pointer.vx *= 0.82;
      pointer.vy *= 0.82;
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }

  buildCodeRain();

  function initHeroSurface() {
    const canvas = document.getElementById("heroWaterCanvas");
    const gl = canvas.getContext("webgl", { alpha: false, antialias: true, powerPreference: "high-performance" });
    if (!gl || reduceMotion) return;

    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    const fragmentSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform vec2 u_textureSize;
      uniform float u_time;
      #define MAX_POINTS 24
      uniform vec2 u_points[MAX_POINTS];
      uniform float u_ages[MAX_POINTS];
      uniform int u_count;
      uniform vec2 u_mouse;
      uniform vec2 u_mouseDelta;
      uniform float u_mouseActive;

      float random(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      vec2 coverUv(vec2 uv) {
        float screenAspect = u_resolution.x / u_resolution.y;
        float textureAspect = u_textureSize.x / u_textureSize.y;
        vec2 scale = vec2(1.0);
        if (screenAspect > textureAspect) scale.y = textureAspect / screenAspect;
        else scale.x = screenAspect / textureAspect;
        return (uv - 0.5) * scale + 0.5;
      }

      void main() {
        vec2 pixel = v_uv * u_resolution;
        vec2 displacement = vec2(
          sin(pixel.y * 0.008 + u_time * 0.62) * 0.7,
          sin(pixel.x * 0.006 - u_time * 0.48) * 0.55
        );

        for (int i = 0; i < MAX_POINTS; i++) {
          if (i >= u_count) break;
          vec2 difference = pixel - u_points[i];
          float distance = length(difference);
          float age = u_ages[i];
          float lifespan = 2.8;
          float progress = age / lifespan;
          if (progress > 1.0) continue;
          float radius = 240.0 + age * 230.0;
          float falloff = smoothstep(radius, 0.0, distance);
          float ring = sin(distance * 0.017 - age * 2.25);
          float decay = pow(1.0 - progress, 2.8);
          float amplitude = 4.8 * decay * falloff;
          vec2 direction = distance > 0.001 ? difference / distance : vec2(0.0);
          displacement += direction * ring * amplitude;
        }

        vec2 mouseDifference = pixel - u_mouse;
        float mouseDistance = length(mouseDifference);
        float mouseFalloff = smoothstep(330.0, 0.0, mouseDistance) * u_mouseActive;
        vec2 mouseDirection = mouseDistance > 0.001 ? mouseDifference / mouseDistance : vec2(0.0);
        float liquidWake = sin(mouseDistance * 0.026 - u_time * 4.4);
        float innerRefraction = smoothstep(180.0, 0.0, mouseDistance);
        displacement -= u_mouseDelta * mouseFalloff * 0.68;
        displacement += mouseDirection * liquidWake * mouseFalloff * 5.2;
        displacement -= mouseDirection * innerRefraction * mouseFalloff * 3.6;

        vec2 baseUv = coverUv(v_uv);
        vec2 displacedUv = baseUv + displacement / u_resolution;
        vec3 color = texture2D(u_texture, clamp(displacedUv, 0.0, 1.0)).rgb;
        float displacementSize = length(displacement);
        if (displacementSize > 0.001) {
          vec2 offset = displacement / u_resolution * 0.32;
          color.r = mix(color.r, texture2D(u_texture, clamp(baseUv + displacement / u_resolution + offset, 0.0, 1.0)).r, 0.52);
          color.b = mix(color.b, texture2D(u_texture, clamp(baseUv + displacement / u_resolution - offset, 0.0, 1.0)).b, 0.52);
        }

        float spotlight = smoothstep(360.0, 0.0, mouseDistance) * u_mouseActive;
        color += spotlight * 0.018;
        float grain = random(v_uv * u_resolution + u_time * 60.0);
        color += (grain - 0.5) * 0.022;
        vec2 vignetteUv = v_uv - 0.5;
        color *= 1.0 - dot(vignetteUv, vignetteUv) * 0.4;
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
      return shader;
    }

    const program = gl.createProgram();
    const vertexShader = compile(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compile(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      texture: gl.getUniformLocation(program, "u_texture"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      textureSize: gl.getUniformLocation(program, "u_textureSize"),
      time: gl.getUniformLocation(program, "u_time"),
      points: gl.getUniformLocation(program, "u_points"),
      ages: gl.getUniformLocation(program, "u_ages"),
      count: gl.getUniformLocation(program, "u_count"),
      mouse: gl.getUniformLocation(program, "u_mouse"),
      mouseDelta: gl.getUniformLocation(program, "u_mouseDelta"),
      mouseActive: gl.getUniformLocation(program, "u_mouseActive"),
    };
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const MAX_POINTS = 24;
    const pointsArray = new Float32Array(MAX_POINTS * 2);
    const agesArray = new Float32Array(MAX_POINTS);
    let points = [];
    let lastEmit = 0;
    let mouseX = 0;
    let mouseY = 0;
    let previousMouseX = 0;
    let previousMouseY = 0;
    let mouseDeltaX = 0;
    let mouseDeltaY = 0;
    let mouseActive = 0;
    let lastMove = 0;
    let ready = false;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.15);
      const width = Math.max(1, Math.round(hero.clientWidth * dpr));
      const height = Math.max(1, Math.round(hero.clientHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function addPoint(x, y, force = false) {
      const now = performance.now() / 1000;
      if (!force && now - lastEmit < 0.072) return;
      lastEmit = now;
      points.push({ x, y, born: now });
      if (points.length > MAX_POINTS) points.shift();
    }

    function move(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      const dpr = canvas.width / rect.width;
      mouseX = (clientX - rect.left) * dpr;
      mouseY = canvas.height - (clientY - rect.top) * dpr;
      if (lastMove) {
        const rawDeltaX = Math.max(-34, Math.min(34, mouseX - previousMouseX));
        const rawDeltaY = Math.max(-34, Math.min(34, mouseY - previousMouseY));
        mouseDeltaX += (rawDeltaX - mouseDeltaX) * 0.22;
        mouseDeltaY += (rawDeltaY - mouseDeltaY) * 0.22;
      }
      previousMouseX = mouseX;
      previousMouseY = mouseY;
      lastMove = performance.now() / 1000;
      addPoint(mouseX, mouseY);
    }

    hero.addEventListener("pointermove", (event) => move(event.clientX, event.clientY));
    hero.addEventListener("pointerleave", () => { lastMove = 0; });
    hero.addEventListener("touchmove", (event) => {
      const touch = event.touches[0];
      if (touch) move(touch.clientX, touch.clientY);
    }, { passive: true });

    function loadImage(source) {
      return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image), { once: true });
        image.addEventListener("error", reject, { once: true });
        image.src = source;
      });
    }

    loadImage("./public/assets/hero-blue.jpg").then((background) => {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, background);
      gl.uniform1i(uniforms.texture, 0);
      gl.uniform2f(uniforms.textureSize, background.naturalWidth, background.naturalHeight);
      ready = true;
      hero.classList.add("webgl-ready");
    }).catch(() => {});

    let idleStep = 0;
    window.setInterval(() => {
      if (!ready || performance.now() / 1000 - lastMove < 1.1) return;
      idleStep += 1;
      addPoint(
        canvas.width * (0.28 + 0.44 * Math.sin(idleStep * 0.71)),
        canvas.height * (0.5 + 0.18 * Math.cos(idleStep * 0.53)),
        true
      );
    }, 1450);

    let lastSurfaceDraw = 0;
    function render(nowMs) {
      if (!heroVisible || document.hidden) {
        requestAnimationFrame(render);
        return;
      }
      if (nowMs - lastSurfaceDraw < 22) {
        requestAnimationFrame(render);
        return;
      }
      lastSurfaceDraw = nowMs;
      resize();
      const now = nowMs / 1000;
      points = points.filter((point) => now - point.born < 2.8);
      for (let index = 0; index < MAX_POINTS; index += 1) {
        if (index < points.length) {
          pointsArray[index * 2] = points[index].x;
          pointsArray[index * 2 + 1] = points[index].y;
          agesArray[index] = now - points[index].born;
        } else {
          pointsArray[index * 2] = 0;
          pointsArray[index * 2 + 1] = 0;
          agesArray[index] = 999;
        }
      }
      mouseActive += (((now - lastMove < 0.5) ? 1 : 0) - mouseActive) * 0.08;
      mouseDeltaX *= 0.82;
      mouseDeltaY *= 0.82;
      if (ready) {
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.time, now);
        gl.uniform2fv(uniforms.points, pointsArray);
        gl.uniform1fv(uniforms.ages, agesArray);
        gl.uniform1i(uniforms.count, points.length);
        gl.uniform2f(uniforms.mouse, mouseX, mouseY);
        gl.uniform2f(uniforms.mouseDelta, mouseDeltaX, mouseDeltaY);
        gl.uniform1f(uniforms.mouseActive, mouseActive);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  }

  initHeroSurface();

  function initHeroWordGlass() {
    const wordCanvas = document.getElementById("heroWordCanvas");
    const wordCenter = wordCanvas?.closest(".hero__center");
    if (!wordCanvas || !wordCenter) return;
    const wordGl = wordCanvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
    if (!wordGl || reduceMotion) return;
    const vertexSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      void main(){v_uv=a_position*.5+.5;gl_Position=vec4(a_position,0.,1.);}
    `;
    const fragmentSource = `
      precision highp float;
      varying vec2 v_uv;
      uniform sampler2D u_texture;
      uniform sampler2D u_flowmap;
      uniform vec2 u_mouse;
      uniform float u_mouseActive;
      void main(){
        vec4 flowSample=texture2D(u_flowmap,v_uv);
        vec2 flow=(flowSample.rg*2.-1.)*flowSample.b;
        float flowStrength=flowSample.b;
        vec2 flowCurl=vec2(-flow.y,flow.x)*flowStrength*.010;
        vec2 displacedUv=v_uv-flow*vec2(.070,.094)+flowCurl;
        vec4 surface=texture2D(u_texture,clamp(displacedUv,0.,1.));
        vec2 texel=vec2(.0018,.0055);
        vec3 sampleLeft=texture2D(u_texture,clamp(displacedUv-vec2(texel.x,0.),0.,1.)).rgb;
        vec3 sampleRight=texture2D(u_texture,clamp(displacedUv+vec2(texel.x,0.),0.,1.)).rgb;
        vec3 sampleTop=texture2D(u_texture,clamp(displacedUv+vec2(0.,texel.y),0.,1.)).rgb;
        vec3 sampleBottom=texture2D(u_texture,clamp(displacedUv-vec2(0.,texel.y),0.,1.)).rgb;
        float leftLight=dot(sampleLeft,vec3(.2126,.7152,.0722));
        float rightLight=dot(sampleRight,vec3(.2126,.7152,.0722));
        float topLight=dot(sampleTop,vec3(.2126,.7152,.0722));
        float bottomLight=dot(sampleBottom,vec3(.2126,.7152,.0722));
        vec3 normal=normalize(vec3(
          (leftLight-rightLight)*4.2,
          (bottomLight-topLight)*4.2,
          1.
        ));
        vec2 localMouse=normalize((u_mouse-displacedUv)+vec2(.0001));
        vec3 lightDirection=normalize(vec3(localMouse,.72));
        float movingHighlight=pow(max(dot(normal,lightDirection),0.),7.)*flowStrength*u_mouseActive;
        float flowLength=length(flow);
        vec2 flowDirection=flow/ max(flowLength,.001);
        float trailRim=pow(max(dot(normal.xy,-flowDirection),0.),2.4)*flowStrength;
        float trailShade=pow(max(dot(normal.xy,flowDirection),0.),2.)*flowStrength;
        vec3 color=pow(max(surface.rgb,vec3(0.)),vec3(.78));
        color*=vec3(1.10,1.16,1.28);
        color+=vec3(.68,.82,1.)*movingHighlight*.30;
        color+=vec3(.42,.62,1.)*trailRim*.20;
        color*=1.-trailShade*.025;
        color*=1.+flowStrength*.045;
        gl_FragColor=vec4(color,surface.a*.94);
      }
    `;
    function compileWordShader(type,source){
      const shader=wordGl.createShader(type);
      wordGl.shaderSource(shader,source);
      wordGl.compileShader(shader);
      return wordGl.getShaderParameter(shader,wordGl.COMPILE_STATUS)?shader:null;
    }
    const vertexShader=compileWordShader(wordGl.VERTEX_SHADER,vertexSource);
    const fragmentShader=compileWordShader(wordGl.FRAGMENT_SHADER,fragmentSource);
    if(!vertexShader||!fragmentShader)return;
    const program=wordGl.createProgram();
    wordGl.attachShader(program,vertexShader);
    wordGl.attachShader(program,fragmentShader);
    wordGl.linkProgram(program);
    if(!wordGl.getProgramParameter(program,wordGl.LINK_STATUS))return;
    wordGl.useProgram(program);
    const buffer=wordGl.createBuffer();
    wordGl.bindBuffer(wordGl.ARRAY_BUFFER,buffer);
    wordGl.bufferData(wordGl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),wordGl.STATIC_DRAW);
    const position=wordGl.getAttribLocation(program,"a_position");
    wordGl.enableVertexAttribArray(position);
    wordGl.vertexAttribPointer(position,2,wordGl.FLOAT,false,0,0);
    const uniforms={
      texture:wordGl.getUniformLocation(program,"u_texture"),
      flowmap:wordGl.getUniformLocation(program,"u_flowmap"),
      mouse:wordGl.getUniformLocation(program,"u_mouse"),
      mouseActive:wordGl.getUniformLocation(program,"u_mouseActive"),
    };
    const texture=wordGl.createTexture();
    wordGl.activeTexture(wordGl.TEXTURE0);
    wordGl.bindTexture(wordGl.TEXTURE_2D,texture);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_WRAP_S,wordGl.CLAMP_TO_EDGE);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_WRAP_T,wordGl.CLAMP_TO_EDGE);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_MIN_FILTER,wordGl.LINEAR);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_MAG_FILTER,wordGl.LINEAR);
    const flowTexture=wordGl.createTexture();
    const flowWidth=64;
    const flowHeight=24;
    const flowField=new Float32Array(flowWidth*flowHeight*3);
    const flowPixels=new Uint8Array(flowWidth*flowHeight*4);
    wordGl.activeTexture(wordGl.TEXTURE1);
    wordGl.bindTexture(wordGl.TEXTURE_2D,flowTexture);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_WRAP_S,wordGl.CLAMP_TO_EDGE);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_WRAP_T,wordGl.CLAMP_TO_EDGE);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_MIN_FILTER,wordGl.LINEAR);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_MAG_FILTER,wordGl.LINEAR);
    wordGl.texImage2D(wordGl.TEXTURE_2D,0,wordGl.RGBA,flowWidth,flowHeight,0,wordGl.RGBA,wordGl.UNSIGNED_BYTE,flowPixels);
    wordGl.enable(wordGl.BLEND);
    wordGl.blendFunc(wordGl.SRC_ALPHA,wordGl.ONE_MINUS_SRC_ALPHA);
    const wordImage = new Image();
    let targetLightX = 0.5;
    let targetLightY = 0.62;
    let lightX = targetLightX;
    let lightY = targetLightY;
    let targetVelocityX=0;
    let targetVelocityY=0;
    let velocityX=0;
    let velocityY=0;
    let previousPointerX=.5;
    let previousPointerY=.62;
    let mouseActive=0;
    let wordReady = false;
    let wordFrame=0;
    let lastWordInteraction=0;
    let lastWordDraw=0;
    let flowEnergy=0;

    function splatFlow(x,y,vx,vy){
      const radius=.17;
      for(let row=0;row<flowHeight;row++){
        const py=row/(flowHeight-1);
        for(let col=0;col<flowWidth;col++){
          const px=col/(flowWidth-1);
          const dx=(px-x)*3.4;
          const dy=py-y;
          const distanceSquared=dx*dx+dy*dy;
          if(distanceSquared>radius*radius)continue;
          const weight=Math.exp(-distanceSquared/(radius*radius)*3.2);
          const index=(row*flowWidth+col)*3;
          flowField[index]=Math.max(-1,Math.min(1,flowField[index]+vx*weight));
          flowField[index+1]=Math.max(-1,Math.min(1,flowField[index+1]+vy*weight));
          flowField[index+2]=Math.max(flowField[index+2],weight);
        }
      }
      flowEnergy=1;
    }

    function updateFlowmap(deltaSeconds){
      const velocityDecay=Math.pow(.915,deltaSeconds*60);
      const strengthDecay=Math.pow(.955,deltaSeconds*60);
      let strongest=0;
      for(let index=0,pixel=0;index<flowField.length;index+=3,pixel+=4){
        flowField[index]*=velocityDecay;
        flowField[index+1]*=velocityDecay;
        flowField[index+2]*=strengthDecay;
        strongest=Math.max(strongest,flowField[index+2]);
        flowPixels[pixel]=Math.round((flowField[index]*.5+.5)*255);
        flowPixels[pixel+1]=Math.round((flowField[index+1]*.5+.5)*255);
        flowPixels[pixel+2]=Math.round(flowField[index+2]*255);
        flowPixels[pixel+3]=255;
      }
      flowEnergy=strongest;
      wordGl.activeTexture(wordGl.TEXTURE1);
      wordGl.bindTexture(wordGl.TEXTURE_2D,flowTexture);
      wordGl.pixelStorei(wordGl.UNPACK_FLIP_Y_WEBGL,false);
      wordGl.texSubImage2D(wordGl.TEXTURE_2D,0,0,0,flowWidth,flowHeight,wordGl.RGBA,wordGl.UNSIGNED_BYTE,flowPixels);
    }

    function resizeWordCanvas() {
      const rect = wordCenter.getBoundingClientRect();
      const renderScale=Math.min(window.devicePixelRatio||1,1.35);
      const width = Math.max(1, Math.round(rect.width*renderScale));
      const height = Math.max(1, Math.round(rect.height*renderScale));
      if (wordCanvas.width !== width || wordCanvas.height !== height) {
        wordCanvas.width = width;
        wordCanvas.height = height;
        wordGl.viewport(0,0,width,height);
      }
    }

    function updateWordLight(event) {
      const rect = wordCenter.getBoundingClientRect();
      targetLightX = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      targetLightY = 1-Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      targetVelocityX=Math.max(-.025,Math.min(.025,targetLightX-previousPointerX));
      targetVelocityY=Math.max(-.025,Math.min(.025,targetLightY-previousPointerY));
      previousPointerX=targetLightX;
      previousPointerY=targetLightY;
      mouseActive=1;
      const now=performance.now();
      splatFlow(targetLightX,targetLightY,targetVelocityX*24,targetVelocityY*24);
      lastWordInteraction=now;
      if(!wordFrame&&wordReady)wordFrame=requestAnimationFrame(drawWordGlass);
    }

    hero.addEventListener("pointermove", updateWordLight);
    hero.addEventListener("pointerleave", () => {
      targetLightX = 0.5;
      targetLightY = 0.62;
      mouseActive=0;
      lastWordInteraction=performance.now();
      if(!wordFrame&&wordReady)wordFrame=requestAnimationFrame(drawWordGlass);
    });
    window.addEventListener("resize", resizeWordCanvas);

    function drawWordGlass(nowMs) {
      wordFrame=0;
      if (!wordReady || !heroVisible || document.hidden) return;
      if(nowMs-lastWordDraw<16){
        wordFrame=requestAnimationFrame(drawWordGlass);
        return;
      }
      const deltaSeconds=Math.min(.034,Math.max(.001,(nowMs-lastWordDraw)/1000));
      lastWordDraw=nowMs;
      resizeWordCanvas();
      lightX+=(targetLightX-lightX)*.32;
      lightY+=(targetLightY-lightY)*.32;
      velocityX+=(targetVelocityX-velocityX)*.12;
      velocityY+=(targetVelocityY-velocityY)*.12;
      targetVelocityX*=.72;
      targetVelocityY*=.72;
      velocityX*=.92;
      velocityY*=.92;
      wordGl.clearColor(0,0,0,0);
      wordGl.clear(wordGl.COLOR_BUFFER_BIT);
      updateFlowmap(deltaSeconds);
      wordGl.activeTexture(wordGl.TEXTURE0);
      wordGl.bindTexture(wordGl.TEXTURE_2D,texture);
      wordGl.uniform2f(uniforms.mouse,lightX,lightY);
      wordGl.uniform1f(uniforms.mouseActive,mouseActive);
      wordGl.drawArrays(wordGl.TRIANGLES,0,6);
      const moving=Math.abs(targetLightX-lightX)+Math.abs(targetLightY-lightY)+Math.abs(velocityX)+Math.abs(velocityY)>.0015;
      if(nowMs-lastWordInteraction<1200||moving||flowEnergy>.012)wordFrame=requestAnimationFrame(drawWordGlass);
    }

    wordImage.addEventListener("load", () => {
      wordGl.activeTexture(wordGl.TEXTURE0);
      wordGl.bindTexture(wordGl.TEXTURE_2D,texture);
      wordGl.pixelStorei(wordGl.UNPACK_FLIP_Y_WEBGL,true);
      wordGl.texImage2D(wordGl.TEXTURE_2D,0,wordGl.RGBA,wordGl.RGBA,wordGl.UNSIGNED_BYTE,wordImage);
      wordGl.uniform1i(uniforms.texture,0);
      wordGl.uniform1i(uniforms.flowmap,1);
      wordReady = true;
      wordCenter.classList.add("word-canvas-ready");
      lastWordInteraction=performance.now();
      wordFrame=requestAnimationFrame(drawWordGlass);
    }, { once: true });
    wordImage.src = "./public/assets/aqua-logo.png";
  }

  initHeroWordGlass();

  document.querySelectorAll(".portfolio-screen").forEach((screen) => {
    const nav = document.createElement("nav");
    nav.className = "portfolio-nav pixel";
    nav.setAttribute("aria-label", "Навигация по портфолио");
    [
      ["MAIN", "#main"],
      ["ABOUT", "#about"],
      ["WORK", "#work"],
      ["CONTACT", "#contact"],
    ].forEach(([label, href]) => {
      const link = document.createElement("a");
      link.href = href;
      link.textContent = label;
      if (label === "WORK") link.setAttribute("aria-current", "page");
      nav.appendChild(link);
    });
    screen.appendChild(nav);
  });

  const cursor = document.getElementById("cursor");
  let pointerX = -80;
  let pointerY = -80;
  let cursorX = -80;
  let cursorY = -80;
  let lastPointerPixel = 0;

  function animateCursor() {
    cursorX += (pointerX - cursorX) * 0.18;
    cursorY += (pointerY - cursorY) * 0.18;
    cursor.style.setProperty("--x", `${cursorX}px`);
    cursor.style.setProperty("--y", `${cursorY}px`);
    requestAnimationFrame(animateCursor);
  }

  if (finePointer) {
    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!body.classList.contains("native-cursor") && performance.now() - lastPointerPixel > 34) {
        lastPointerPixel = performance.now();
        createTrailPixel(event.clientX, event.clientY);
      }
    });
    animateCursor();

    document.querySelectorAll("a, [data-tilt]").forEach((element) => {
      element.addEventListener("pointerenter", () => cursor.classList.add("is-active"));
      element.addEventListener("pointerleave", () => cursor.classList.remove("is-active"));
    });
  }

  function createTrailPixel(x, y) {
    const trail = document.getElementById("cursorTrail");
    const pixel = document.createElement("span");
    pixel.className = "trail-pixel";
    pixel.style.left = `${x}px`;
    pixel.style.top = `${y}px`;
    pixel.style.setProperty("--size", `${4 + Math.random() * 8}px`);
    pixel.style.setProperty("--rotation", `${Math.random() * 90}deg`);
    trail.appendChild(pixel);
    window.setTimeout(() => pixel.remove(), 950);
  }

  let lastTouchPixel = 0;
  window.addEventListener("touchmove", (event) => {
    if (window.scrollY < innerHeight * 0.75 || performance.now() - lastTouchPixel < 26) return;
    lastTouchPixel = performance.now();
    const touch = event.touches[0];
    if (touch) createTrailPixel(touch.clientX, touch.clientY);
  }, { passive: true });

  const heroCursorObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const heroIsActive = entry.isIntersecting && entry.intersectionRatio > 0.42;
      heroVisible = entry.isIntersecting;
      body.classList.toggle("native-cursor", heroIsActive);
    });
  }, { threshold: [0, 0.42, 0.75] });
  heroCursorObserver.observe(hero);

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8%" });

  document.querySelectorAll(".work-card, .about__portrait, .about__copy")
    .forEach((element) => revealObserver.observe(element));

  if (about && aboutSignature) {
    let signatureReadyToReplay = true;

    const updateAboutSignature = () => {
      const rect = about.getBoundingClientRect();
      const fillsViewport = rect.top <= 1 && rect.bottom >= innerHeight - 1;
      const isFarFromViewport = rect.top > innerHeight * 0.55 || rect.bottom < innerHeight * 0.45;

      if (fillsViewport && signatureReadyToReplay) {
        aboutSignature.classList.remove("is-visible", "is-written");
        void aboutSignature.offsetWidth;
        aboutSignature.classList.add("is-visible");
        signatureReadyToReplay = false;
      } else if (isFarFromViewport) {
        aboutSignature.classList.remove("is-visible", "is-written");
        signatureReadyToReplay = true;
      }
    };

    window.addEventListener("scroll", updateAboutSignature, { passive: true });
    window.addEventListener("resize", updateAboutSignature);
    updateAboutSignature();
  }

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    const paper = card.querySelector(".work-card__paper");
    paper?.setAttribute("data-placeholder", card.dataset.placeholder || "VIEW PROJECT");
    if (!finePointer || !paper) return;

    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const normalizedX = (event.clientX - rect.left) / rect.width - 0.5;
      const normalizedY = (event.clientY - rect.top) / rect.height - 0.5;
      paper.style.transform = `rotateX(${-normalizedY * 7}deg) rotateY(${normalizedX * 9}deg) translateZ(18px)`;
    });
    card.addEventListener("pointerleave", () => {
      paper.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
    });
  });

  const mobileWorkQuery = window.matchMedia("(max-width: 760px)");
  const mobileProjectCards = [...document.querySelectorAll(".portfolio-screen .screen-card")];

  const syncMobileProjectAccessibility = () => {
    mobileProjectCards.forEach((card) => {
      if (mobileWorkQuery.matches) {
        const projectName = card.querySelector(".screen-card__main")?.alt || "Проект";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `${projectName}. Коснитесь, чтобы показать заглушку`);
        card.setAttribute("aria-pressed", String(card.classList.contains("is-placeholder")));
      } else {
        card.removeAttribute("role");
        card.removeAttribute("tabindex");
        card.removeAttribute("aria-label");
        card.removeAttribute("aria-pressed");
        card.classList.remove("is-placeholder");
      }
    });
  };

  const toggleMobileProject = (card) => {
    if (!mobileWorkQuery.matches) return;
    const isPlaceholder = card.classList.toggle("is-placeholder");
    const projectName = card.querySelector(".screen-card__main")?.alt || "Проект";
    card.setAttribute("aria-pressed", String(isPlaceholder));
    card.setAttribute(
      "aria-label",
      `${projectName}. Коснитесь, чтобы показать ${isPlaceholder ? "проект" : "заглушку"}`
    );
  };

  mobileProjectCards.forEach((card) => {
    let tapStart = null;
    let ignoreClickUntil = 0;

    card.addEventListener("pointerdown", (event) => {
      if (!mobileWorkQuery.matches || (event.pointerType !== "touch" && event.pointerType !== "pen")) return;
      tapStart = { x: event.clientX, y: event.clientY, time: performance.now() };
    }, { passive: true });

    card.addEventListener("pointerup", (event) => {
      if (!tapStart || !mobileWorkQuery.matches || (event.pointerType !== "touch" && event.pointerType !== "pen")) return;
      const moved = Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y);
      const elapsed = performance.now() - tapStart.time;
      tapStart = null;
      if (moved > 14 || elapsed > 700) return;
      ignoreClickUntil = performance.now() + 800;
      event.preventDefault();
      toggleMobileProject(card);
    });

    card.addEventListener("pointercancel", () => { tapStart = null; });

    card.addEventListener("click", () => {
      if (performance.now() < ignoreClickUntil) return;
      toggleMobileProject(card);
    });

    card.addEventListener("keydown", (event) => {
      if (!mobileWorkQuery.matches || (event.key !== "Enter" && event.key !== " ")) return;
      event.preventDefault();
      toggleMobileProject(card);
    });
  });

  mobileWorkQuery.addEventListener?.("change", syncMobileProjectAccessibility);
  syncMobileProjectAccessibility();

  let heroTargetX = 0;
  let heroTargetY = 0;
  let heroCurrentX = 0;
  let heroCurrentY = 0;
  let latestScrollY = window.scrollY;
  let previousScrollY = latestScrollY;
  let scrollVelocity = 0;
  let interactionFrame = 0;
  const heroCenter = hero.querySelector(".hero__center");
  const heroBackground = hero.querySelector(".hero__background");
  const heroDecoration = hero.querySelector(".hero__cursor-decoration");
  const workCards = [...document.querySelectorAll(".work-card")];

  if (finePointer && !reduceMotion) {
    hero.addEventListener("pointermove", (event) => {
      heroTargetX = event.clientX / innerWidth - 0.5;
      heroTargetY = event.clientY / innerHeight - 0.5;
    });
    hero.addEventListener("pointerleave", () => {
      heroTargetX = 0;
      heroTargetY = 0;
    });
  }

  window.addEventListener("scroll", () => { latestScrollY = window.scrollY; }, { passive: true });

  let cardsSettled = false;
  function animateInteractions(now) {
    if (heroVisible) {
      heroCurrentX += (heroTargetX - heroCurrentX) * 0.055;
      heroCurrentY += (heroTargetY - heroCurrentY) * 0.055;
      const floatX = reduceMotion ? 0 : Math.sin(now * 0.00031) * 2.2;
      const floatY = reduceMotion ? 0 : Math.cos(now * 0.00027) * 3;
      heroCenter?.style.setProperty("--hero-x", `${heroCurrentX * 32 + floatX}px`);
      heroCenter?.style.setProperty("--hero-y", `${heroCurrentY * 21 + floatY}px`);
      heroCenter?.style.setProperty("--hero-rx", `${-heroCurrentY * 2.2}deg`);
      heroCenter?.style.setProperty("--hero-ry", `${heroCurrentX * 2.8}deg`);
      if (heroBackground && !hero.classList.contains("webgl-ready")) {
        heroBackground.style.transform = `scale(1.028) translate3d(${heroCurrentX * -7}px, ${heroCurrentY * -5}px, 0)`;
      }
      if (heroDecoration) {
        heroDecoration.style.transform = `translate3d(${heroCurrentX * 18}px, ${heroCurrentY * 13}px, 0) rotate(${heroCurrentX * 2}deg)`;
      }
    }

    const rawVelocity = latestScrollY - previousScrollY;
    previousScrollY = latestScrollY;
    scrollVelocity += (rawVelocity - scrollVelocity) * 0.16;
    scrollVelocity *= 0.86;
    const bend = reduceMotion ? 0 : Math.max(-5.2, Math.min(5.2, scrollVelocity * -0.075));
    const skew = reduceMotion ? 0 : Math.max(-1.1, Math.min(1.1, scrollVelocity * 0.014));
    const cardsMoving = Math.abs(rawVelocity) > 0.01 || Math.abs(scrollVelocity) > 0.03;
    if (cardsMoving || !cardsSettled) {
      workCards.forEach((card, index) => {
        const direction = index % 2 ? -1 : 1;
        card.style.setProperty("--scroll-bend", `${bend * direction}deg`);
        card.style.setProperty("--scroll-skew", `${skew * direction}deg`);
      });
      cardsSettled = !cardsMoving;
    }
    interactionFrame = requestAnimationFrame(animateInteractions);
  }
  interactionFrame = requestAnimationFrame(animateInteractions);

  function updateClock() {
    const clock = document.getElementById("clock");
    const parts = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    const temperature = document.documentElement.dataset.temperature || "--";
    const statusText = `GMT+3 MSK ${parts} ${temperature}°C`;
    if (clock) clock.textContent = statusText;
    if (fixedLiveStatus) fixedLiveStatus.textContent = statusText;
  }

  updateClock();
  window.setInterval(updateClock, 15000);

  async function updateMoscowWeather() {
    try {
      const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current=temperature_2m&timezone=Europe%2FMoscow");
      if (!response.ok) throw new Error("Weather unavailable");
      const data = await response.json();
      const value = Math.round(data?.current?.temperature_2m);
      if (Number.isFinite(value)) {
        document.documentElement.dataset.temperature = String(value);
        updateClock();
      }
    } catch {
      updateClock();
    }
  }

  updateMoscowWeather();
  window.setInterval(updateMoscowWeather, 10 * 60 * 1000);

  const canvas = document.getElementById("fireworks");
  const context = hasLogoTransition ? null : canvas.getContext("2d");
  const contactStage = contact.querySelector(".contact__stage");
  const contactCursor = contact.querySelector(".contact__cursor-3d");
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasDpr = 1;

  function resizeCanvas() {
    const rect = contactStage.getBoundingClientRect();
    canvasDpr = Math.min(2, window.devicePixelRatio || 1);
    canvasWidth = Math.max(1, rect.width);
    canvasHeight = Math.max(1, rect.height);
    canvas.width = Math.round(canvasWidth * canvasDpr);
    canvas.height = Math.round(canvasHeight * canvasDpr);
    context.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
  }

  function drawContactTunnel(progress) {
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    if (progress >= 0.7) return;
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    const maximumRadius = Math.hypot(canvasWidth, canvasHeight) * 0.72;
    const tunnelProgress = Math.min(1, progress / 0.7);
    const palette = ["#7df9ed", "#e3e3db", "#7b61ff", "#c0fe04"];
    context.lineCap = "round";
    for (let index = 0; index < 260; index += 1) {
      const seed = ((index * 73) % 263) / 263;
      const angle = index * 2.399963 + Math.sin(index * 12.7) * 0.12;
      const depth = (seed + tunnelProgress * 1.85) % 1;
      const easedDepth = depth * depth;
      const innerRadius = 18 + easedDepth * maximumRadius;
      const length = 10 + easedDepth * (55 + tunnelProgress * 95);
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      context.globalAlpha = 0.18 + easedDepth * 0.82;
      context.strokeStyle = palette[index % palette.length];
      context.lineWidth = 0.7 + easedDepth * 2.5;
      context.beginPath();
      context.moveTo(centerX + cos * innerRadius, centerY + sin * innerRadius);
      context.lineTo(centerX + cos * (innerRadius + length), centerY + sin * (innerRadius + length));
      context.stroke();
    }
    const voidRadius = 18 + tunnelProgress * 68;
    const voidGradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, voidRadius);
    voidGradient.addColorStop(0, "#000");
    voidGradient.addColorStop(0.6, "rgba(0,0,0,.94)");
    voidGradient.addColorStop(1, "rgba(0,0,0,0)");
    context.fillStyle = voidGradient;
    context.fillRect(centerX - voidRadius, centerY - voidRadius, voidRadius * 2, voidRadius * 2);
    context.globalAlpha = 1;
  }

  if (!hasLogoTransition) {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const contactObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const active = entry.isIntersecting;
        contact.classList.toggle("is-active", active);
        cursor.classList.toggle("is-contact", active);
        if (active) resizeCanvas();
      });
    }, { threshold: 0.01 });
    contactObserver.observe(contact);
  }

  function updateContactSequence() {
    if (hasLogoTransition) return;
    const rect = contact.getBoundingClientRect();
    const travel = Math.max(1, contact.offsetHeight - innerHeight);
    const progress = Math.max(0, Math.min(1, -rect.top / travel));
    const tunnelEnd = reduceMotion ? 0.05 : 0.56;
    const cursorEnd = reduceMotion ? 0.12 : 0.82;
    const cursorProgress = Math.max(0, Math.min(1, (progress - tunnelEnd) / (cursorEnd - tunnelEnd)));
    drawContactTunnel(progress);

    if (contactCursor) {
      const scale = reduceMotion ? 1 : 0.9 + Math.pow(cursorProgress, 1.45) * 19;
      const flipY = cursorProgress * 360;
      const flipX = Math.sin(cursorProgress * Math.PI) * 28;
      const opacity = progress < tunnelEnd ? 0 : progress <= cursorEnd ? 1 : Math.max(0, 1 - (progress - cursorEnd) * 18);
      contactCursor.style.opacity = String(opacity);
      contactCursor.style.transform =
        `translate(-50%, -50%) perspective(900px) rotateX(${flipX}deg) rotateY(${flipY}deg) rotateZ(${-8 + cursorProgress * 24}deg) scale(${scale})`;
      contactCursor.style.filter =
        `drop-shadow(2px 3px 0 #668ce8) drop-shadow(4px 6px 0 #3558b7) drop-shadow(7px 10px 0 #173274) ` +
        `drop-shadow(18px 24px ${22 + cursorProgress * 30}px rgba(0,0,0,.55)) blur(${Math.max(0, cursorProgress - .9) * 6}px)`;
    }

    contact.classList.toggle("is-bursting", progress >= cursorEnd - 0.035 && progress < cursorEnd + 0.055);
    contact.classList.toggle("show-contact", progress >= cursorEnd + (reduceMotion ? 0 : 0.035));
  }

  function updateFixedMetaVisibility() {
    const aboutRect = about.getBoundingClientRect();
    body.classList.toggle("show-fixed-meta", aboutRect.top <= 1);
  }

  window.addEventListener("scroll", () => {
    const rect = about.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / innerHeight));
    const radius = (1 - progress) * 54;
    about.style.borderRadius = `${radius}px ${radius}px 0 0`;
    fixedMark.classList.toggle("is-dark-scene", window.scrollY >= innerHeight * 0.62);
    updateFixedMetaVisibility();
    updateContactSequence();
  }, { passive: true });
  window.addEventListener("resize", () => {
    updateFixedMetaVisibility();
    updateContactSequence();
  });
  updateFixedMetaVisibility();
  updateContactSequence();
})();
