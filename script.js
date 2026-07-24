(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  const body = document.body;
  const loader = document.getElementById("loader");
  const loaderLine = document.getElementById("loaderLine");
  const loaderPercent = document.getElementById("loaderPercent");
  const fixedMark = document.getElementById("fixedMark");
  const contact = document.getElementById("contact");
  const about = document.getElementById("about");
  const hero = document.getElementById("main");
  const qaMode = new URLSearchParams(window.location.search).has("qa");
  let heroVisible = true;

  body.classList.add("is-loading");
  body.classList.add("native-cursor");
  fixedMark.classList.add("hero-hidden");

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

    starts.slice(0, compact ? 10 : starts.length).forEach((start, index) => {
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
    function animate(now) {
      if (!heroVisible || document.hidden || reduceMotion) {
        previous = now;
        requestAnimationFrame(animate);
        return;
      }
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
      const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
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

    function render(nowMs) {
      if (!heroVisible || document.hidden) {
        requestAnimationFrame(render);
        return;
      }
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
      uniform vec2 u_mouse;
      uniform vec2 u_velocity;
      uniform float u_time;
      uniform float u_mouseActive;
      void main(){
        vec2 difference=v_uv-u_mouse;
        difference.x*=3.4;
        float distanceToMouse=length(difference);
        float influence=smoothstep(.34,0.,distanceToMouse)*u_mouseActive;
        vec2 direction=distanceToMouse>.0001?normalize(difference):vec2(0.);
        direction.x/=3.4;
        float wave=sin(distanceToMouse*34.-u_time*4.2);
        vec2 displacedUv=v_uv-u_velocity*influence*.62+direction*wave*influence*.010;
        vec4 surface=texture2D(u_texture,clamp(displacedUv,0.,1.));
        float a1=texture2D(u_texture,clamp(displacedUv+vec2(-.0024,0.),0.,1.)).a;
        float a2=texture2D(u_texture,clamp(displacedUv+vec2(.0024,0.),0.,1.)).a;
        float a3=texture2D(u_texture,clamp(displacedUv+vec2(0.,.006),0.,1.)).a;
        float edge=clamp(surface.a-min(min(a1,a2),a3),0.,1.);
        float lamp=exp(-distanceToMouse*distanceToMouse*18.)*u_mouseActive;
        float gloss=pow(max(0.,1.-distanceToMouse*2.2),3.)*u_mouseActive;
        vec3 color=surface.rgb+vec3(.40,.55,.92)*lamp*.22+vec3(1.)*gloss*.38+vec3(.78,.88,1.)*edge*.78;
        gl_FragColor=vec4(color,clamp(surface.a*.76+edge*.18,0.,.92));
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
      mouse:wordGl.getUniformLocation(program,"u_mouse"),
      velocity:wordGl.getUniformLocation(program,"u_velocity"),
      time:wordGl.getUniformLocation(program,"u_time"),
      mouseActive:wordGl.getUniformLocation(program,"u_mouseActive"),
    };
    const texture=wordGl.createTexture();
    wordGl.bindTexture(wordGl.TEXTURE_2D,texture);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_WRAP_S,wordGl.CLAMP_TO_EDGE);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_WRAP_T,wordGl.CLAMP_TO_EDGE);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_MIN_FILTER,wordGl.LINEAR);
    wordGl.texParameteri(wordGl.TEXTURE_2D,wordGl.TEXTURE_MAG_FILTER,wordGl.LINEAR);
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

    function resizeWordCanvas() {
      const rect = wordCenter.getBoundingClientRect();
      const width = Math.max(1, Math.round(rect.width));
      const height = Math.max(1, Math.round(rect.height));
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
    }

    hero.addEventListener("pointermove", updateWordLight);
    hero.addEventListener("pointerleave", () => {
      targetLightX = 0.5;
      targetLightY = 0.62;
      mouseActive=0;
    });
    window.addEventListener("resize", resizeWordCanvas);

    function drawWordGlass(nowMs) {
      requestAnimationFrame(drawWordGlass);
      if (!wordReady || !heroVisible || document.hidden) return;
      resizeWordCanvas();
      lightX+=(targetLightX-lightX)*.065;
      lightY+=(targetLightY-lightY)*.065;
      velocityX+=(targetVelocityX-velocityX)*.12;
      velocityY+=(targetVelocityY-velocityY)*.12;
      targetVelocityX*=.72;
      targetVelocityY*=.72;
      velocityX*=.92;
      velocityY*=.92;
      wordGl.clearColor(0,0,0,0);
      wordGl.clear(wordGl.COLOR_BUFFER_BIT);
      wordGl.uniform2f(uniforms.mouse,lightX,lightY);
      wordGl.uniform2f(uniforms.velocity,velocityX,velocityY);
      wordGl.uniform1f(uniforms.time,nowMs/1000);
      wordGl.uniform1f(uniforms.mouseActive,mouseActive);
      wordGl.drawArrays(wordGl.TRIANGLES,0,6);
    }

    wordImage.addEventListener("load", () => {
      const croppedWord=document.createElement("canvas");
      croppedWord.width=1577;
      croppedWord.height=463;
      croppedWord.getContext("2d").drawImage(wordImage,252,372,1978,581,0,0,1577,463);
      wordGl.bindTexture(wordGl.TEXTURE_2D,texture);
      wordGl.pixelStorei(wordGl.UNPACK_FLIP_Y_WEBGL,true);
      wordGl.texImage2D(wordGl.TEXTURE_2D,0,wordGl.RGBA,wordGl.RGBA,wordGl.UNSIGNED_BYTE,croppedWord);
      wordGl.uniform1i(uniforms.texture,0);
      wordReady = true;
      wordCenter.classList.add("word-canvas-ready");
    }, { once: true });
    wordImage.src = "./public/assets/hero-word-figma-exact.png";
    requestAnimationFrame(drawWordGlass);
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
      fixedMark.classList.toggle("hero-hidden", heroIsActive);
    });
  }, { threshold: [0, 0.42, 0.75] });
  heroCursorObserver.observe(hero);

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        if (entry.target.classList.contains("about__signature") && !entry.target.dataset.written) {
          entry.target.dataset.written = "true";
          window.setTimeout(() => entry.target.classList.add("is-written"), reduceMotion ? 0 : 2550);
        }
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8%" });

  document.querySelectorAll(".work-card, .about__portrait, .about__copy, .about__signature")
    .forEach((element) => revealObserver.observe(element));

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

  function animateInteractions(now) {
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

    const rawVelocity = latestScrollY - previousScrollY;
    previousScrollY = latestScrollY;
    scrollVelocity += (rawVelocity - scrollVelocity) * 0.16;
    scrollVelocity *= 0.86;
    const bend = reduceMotion ? 0 : Math.max(-5.2, Math.min(5.2, scrollVelocity * -0.075));
    const skew = reduceMotion ? 0 : Math.max(-1.1, Math.min(1.1, scrollVelocity * 0.014));
    workCards.forEach((card, index) => {
      const direction = index % 2 ? -1 : 1;
      card.style.setProperty("--scroll-bend", `${bend * direction}deg`);
      card.style.setProperty("--scroll-skew", `${skew * direction}deg`);
    });
    interactionFrame = requestAnimationFrame(animateInteractions);
  }
  interactionFrame = requestAnimationFrame(animateInteractions);

  function updateClock() {
    const clock = document.getElementById("clock");
    if (!clock) return;
    const parts = new Intl.DateTimeFormat("ru-RU", {
      timeZone: "Europe/Moscow",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());
    const temperature = document.documentElement.dataset.temperature || "27";
    clock.textContent = `GMT+3 MSK ${parts} ${temperature}°C`;
  }

  updateClock();
  window.setInterval(updateClock, 15000);

  fetch("https://api.open-meteo.com/v1/forecast?latitude=55.7558&longitude=37.6173&current=temperature_2m&timezone=Europe%2FMoscow")
    .then((response) => {
      if (!response.ok) throw new Error("Weather unavailable");
      return response.json();
    })
    .then((data) => {
      const value = Math.round(data?.current?.temperature_2m);
      if (Number.isFinite(value)) {
        document.documentElement.dataset.temperature = String(value);
        updateClock();
      }
    })
    .catch(() => {
      document.documentElement.dataset.temperature = "27";
    });

  const canvas = document.getElementById("fireworks");
  const context = canvas.getContext("2d");
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

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const active = entry.isIntersecting;
      contact.classList.toggle("is-active", active);
      fixedMark.classList.toggle("is-hidden", active);
      cursor.classList.toggle("is-contact", active);
      if (active) resizeCanvas();
    });
  }, { threshold: 0.01 });
  contactObserver.observe(contact);

  function updateContactSequence() {
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

  window.addEventListener("scroll", () => {
    const rect = about.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (innerHeight - rect.top) / innerHeight));
    const radius = (1 - progress) * 54;
    about.style.borderRadius = `${radius}px ${radius}px 0 0`;
    fixedMark.classList.toggle("is-dark-scene", window.scrollY >= innerHeight * 0.62);
    updateContactSequence();
  }, { passive: true });
  window.addEventListener("resize", updateContactSequence);
  updateContactSequence();
})();
