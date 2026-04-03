(function initGraphTheme() {
  const body = document.body;
  if (!body || !body.classList.contains("graph-theme")) {
    return;
  }

  const touchDevice = window.matchMedia("(pointer: coarse)").matches;
  const canvas = document.createElement("canvas");
  canvas.className = "graph-canvas";
  body.prepend(canvas);

  const vignette = document.createElement("div");
  vignette.className = "graph-vignette";
  body.appendChild(vignette);

  let cursor = null;
  if (!touchDevice) {
    cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    body.appendChild(cursor);
    document.addEventListener("mousemove", (event) => {
      cursor.style.left = event.clientX + "px";
      cursor.style.top = event.clientY + "px";
    });
  }

  const ctx = canvas.getContext("2d");
  const mouse = { x: null, y: null };
  const particles = [];
  const particleCount = touchDevice ? 75 : body.classList.contains("room-body") ? 110 : 165;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createParticles() {
    particles.length = 0;
    for (let index = 0; index < particleCount; index += 1) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.4 + 0.5,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach((particle, firstIndex) => {
      particle.x += particle.speedX;
      particle.y += particle.speedY;

      if (particle.x <= 0 || particle.x >= canvas.width) {
        particle.speedX *= -1;
      }
      if (particle.y <= 0 || particle.y >= canvas.height) {
        particle.speedY *= -1;
      }

      ctx.fillStyle = "#39ff14";
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      for (let secondIndex = firstIndex + 1; secondIndex < particles.length; secondIndex += 1) {
        const other = particles[secondIndex];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 88) {
          ctx.strokeStyle = "rgba(54, 155, 95, 0.34)";
          ctx.lineWidth = 0.45;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }

      if (mouse.x !== null && mouse.y !== null) {
        const dxMouse = particle.x - mouse.x;
        const dyMouse = particle.y - mouse.y;
        const mouseDistance = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        if (mouseDistance < 110) {
          ctx.strokeStyle = "rgba(57, 255, 20, 0.24)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
    });

    window.requestAnimationFrame(draw);
  }

  resize();
  createParticles();
  draw();

  window.addEventListener("resize", () => {
    resize();
    createParticles();
  });

  document.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;
  });
})();
