'use client';
import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  opacity: number;
}

export default function HeroCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf: number;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setSize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    setSize();

    const W = () => canvas.offsetWidth;
    const H = () => canvas.offsetHeight;

    const N = 70;
    const MAX_DIST = 140;

    const particles: Particle[] = Array.from({ length: N }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      r: Math.random() * 1.6 + 0.4,
      opacity: Math.random() * 0.4 + 0.15,
    }));

    let mouseX = -1000;
    let mouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', onMouseMove);

    const tick = () => {
      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const mdx = mouseX - p.x;
        const mdy = mouseY - p.y;
        const md = Math.hypot(mdx, mdy);
        if (md < 200 && md > 0) {
          p.vx += (mdx / md) * 0.012;
          p.vy += (mdy / md) * 0.012;
          const speed = Math.hypot(p.vx, p.vy);
          if (speed > 1.2) { p.vx *= 1.2 / speed; p.vy *= 1.2 / speed; }
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${p.opacity})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.hypot(dx, dy);
          if (d < MAX_DIST) {
            const alpha = (1 - d / MAX_DIST) * 0.13;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      if (mouseX > -900) {
        for (const p of particles) {
          const d = Math.hypot(mouseX - p.x, mouseY - p.y);
          if (d < 160) {
            const alpha = (1 - d / 160) * 0.25;
            ctx.beginPath();
            ctx.moveTo(mouseX, mouseY);
            ctx.lineTo(p.x, p.y);
            ctx.strokeStyle = `rgba(99, 179, 237, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(147, 197, 253, 0.5)';
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    tick();

    const onResize = () => { setSize(); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="absolute inset-0 w-full h-full pointer-events-auto"
      style={{ opacity: 0.55 }}
    />
  );
}
