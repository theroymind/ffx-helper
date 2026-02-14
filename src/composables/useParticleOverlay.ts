import type { Core } from "cytoscape";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export function useParticleOverlay(container: HTMLElement) {
  const canvas = document.createElement("canvas");
  canvas.style.position = "absolute";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "10";
  container.style.position = "relative";
  container.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;
  const particles: Particle[] = [];
  let animationId: number | null = null;

  function resize() {
    canvas.width = container.clientWidth * devicePixelRatio;
    canvas.height = container.clientHeight * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function emit(cy: Core, nodeId: string, count = 8) {
    const node = cy.getElementById(nodeId);
    if (!node || node.length === 0) return;

    const pos = node.renderedPosition();
    const zoom = cy.zoom();

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = (40 + Math.random() * 180) * zoom;
      particles.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: (1 + Math.random() * 1) * zoom,
      });
    }

    if (!animationId) {
      lastTime = performance.now();
      animationId = requestAnimationFrame(tick);
    }
  }

  let lastTime = 0;

  function tick(now: number) {
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;

    ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]!;
      p.life -= dt * 1.8;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;

      const alpha = p.life;
      const glow = p.size * (1 + (1 - alpha) * 0.5);

      ctx.globalAlpha = alpha * 0.4;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(p.x, p.y, glow * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#fde68a";
      ctx.beginPath();
      ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    if (particles.length > 0) {
      animationId = requestAnimationFrame(tick);
    } else {
      animationId = null;
    }
  }

  function destroy() {
    resizeObserver.disconnect();
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    canvas.remove();
  }

  return { emit, destroy };
}
