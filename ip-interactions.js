(function initPersonalIP() {
  const stage = document.querySelector("[data-ip-stage]");
  const character = document.querySelector(".ip-character");
  const status = document.querySelector("[data-ip-status]");
  const greeting = document.querySelector("[data-ip-greeting]");
  const liveRegion = document.querySelector("[data-ip-live]");
  const particleCanvas = document.querySelector("[data-ip-webgl]");

  if (!stage || !character || !particleCanvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let greetingTimer = 0;
  let isVisible = true;
  let lastFrame = performance.now();

  const defaultStatus = "MOVE TO CONNECT";
  const hoverStatus = "LOOKING AT YOU";
  const greetingStatus = "HELLO, I'M FULIN";

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function updateGaze(event) {
    const rect = stage.getBoundingClientRect();
    targetX = Math.max(
      -1,
      Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2),
    );
    targetY = Math.max(
      -1,
      Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2),
    );
  }

  function resetGaze() {
    targetX = 0;
    targetY = 0;
  }

  function triggerGreeting() {
    window.clearTimeout(greetingTimer);
    stage.classList.add("is-greeting", "is-active");
    setStatus(greetingStatus);
    if (greeting) greeting.setAttribute("aria-hidden", "false");
    if (liveRegion) liveRegion.textContent = "HELLO, I'M FULIN。你好，我是陈福临。";

    greetingTimer = window.setTimeout(() => {
      stage.classList.remove("is-greeting");
      if (greeting) greeting.setAttribute("aria-hidden", "true");
      setStatus(stage.matches(":hover") ? hoverStatus : defaultStatus);
      if (liveRegion) liveRegion.textContent = "";
    }, 2600);
  }

  if (finePointer.matches) {
    stage.addEventListener("pointerenter", () => {
      stage.classList.add("is-active");
      if (!stage.classList.contains("is-greeting")) setStatus(hoverStatus);
    });

    stage.addEventListener("pointermove", updateGaze, { passive: true });

    stage.addEventListener("pointerleave", () => {
      stage.classList.remove("is-active");
      resetGaze();
      if (!stage.classList.contains("is-greeting")) setStatus(defaultStatus);
    });
  }

  character.addEventListener("click", triggerGreeting);
  character.addEventListener("focus", () => {
    stage.classList.add("is-active");
    if (!stage.classList.contains("is-greeting")) setStatus(hoverStatus);
  });
  character.addEventListener("blur", () => {
    stage.classList.remove("is-active");
    resetGaze();
    if (!stage.classList.contains("is-greeting")) setStatus(defaultStatus);
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
      },
      { threshold: 0.02 },
    );
    observer.observe(stage);
  }

  // Lightweight WebGL particle field. The character itself remains a static,
  // progressively enhanced image, so unsupported devices keep the full visual.
  function createParticleField(canvas) {
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
    });

    if (!gl) return null;

    const vertexSource = `
      attribute vec3 a_position;
      uniform float u_time;
      uniform float u_pixel_ratio;

      void main() {
        vec2 position = a_position.xy;
        position.x += sin(u_time * 0.19 + a_position.y * 4.2) * 0.045;
        position.y += cos(u_time * 0.16 + a_position.x * 5.1) * 0.026;
        gl_Position = vec4(position, 0.0, 1.0);
        gl_PointSize = (1.3 + abs(a_position.z) * 3.2) * u_pixel_ratio;
      }
    `;

    const fragmentSource = `
      precision mediump float;

      void main() {
        float distance_to_center = length(gl_PointCoord - vec2(0.5));
        float alpha = smoothstep(0.5, 0.05, distance_to_center);
        gl_FragColor = vec4(0.60, 0.77, 0.90, alpha * 0.62);
      }
    `;

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return gl.getShaderParameter(shader, gl.COMPILE_STATUS)
        ? shader
        : null;
    }

    const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;

    const count = 135;
    const positions = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      positions[index * 3] = Math.random() * 2 - 1;
      positions[index * 3 + 1] = Math.random() * 2 - 1;
      positions[index * 3 + 2] = Math.random();
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const pixelRatioLocation = gl.getUniformLocation(program, "u_pixel_ratio");

    gl.useProgram(program);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.clearColor(0, 0, 0, 0);

    const state = { width: 0, height: 0, pixelRatio: 1 };

    function resize() {
      const rect = stage.getBoundingClientRect();
      state.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      state.width = Math.max(1, Math.round(rect.width * state.pixelRatio));
      state.height = Math.max(1, Math.round(rect.height * state.pixelRatio));
      canvas.width = state.width;
      canvas.height = state.height;
      gl.viewport(0, 0, state.width, state.height);
    }

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(stage);
    stage.classList.add("is-webgl");

    return {
      render(time) {
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.uniform1f(timeLocation, time);
        gl.uniform1f(pixelRatioLocation, state.pixelRatio);
        gl.drawArrays(gl.POINTS, 0, count);
      },
    };
  }

  const particles = createParticleField(particleCanvas);
  if (!particles) stage.classList.add("no-webgl");

  function animate(time) {
    if (reducedMotion.matches) {
      if (particles) particles.render(0);
      return;
    }

    window.requestAnimationFrame(animate);
    if (!isVisible || document.hidden) return;

    const delta = Math.min((time - lastFrame) / 16.67, 2);
    lastFrame = time;
    currentX += (targetX - currentX) * 0.08 * delta;
    currentY += (targetY - currentY) * 0.08 * delta;

    character.style.setProperty("--look-x", `${currentX * 7}px`);
    character.style.setProperty("--look-y", `${currentY * 3}px`);
    character.style.setProperty("--tilt-y", `${currentX * 5.2}deg`);
    character.style.setProperty("--tilt-x", `${-currentY * 3.1}deg`);

    if (particles) particles.render(time * 0.001);
  }

  if (reducedMotion.matches) {
    if (particles) particles.render(0);
    setStatus("3D PORTRAIT");
  } else {
    window.requestAnimationFrame(animate);
  }
})();
