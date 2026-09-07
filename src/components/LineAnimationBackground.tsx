import { useEffect, useRef } from "react";

export default function LineAnimationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const setSize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    setSize();
    window.addEventListener("resize", setSize);

    const particleCount = Math.min(90, Math.floor((window.innerWidth * window.innerHeight) / 18000));
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        life: Math.random(),
      });
    }

    const connectionDistance = 150;
    let time = 0;

    const render = () => {
      time += 0.004;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.x += p.vx + Math.sin(time * 2 + i) * 0.15;
        p.y += p.vy + Math.cos(time * 1.7 + i * 0.8) * 0.12;

        if (p.x < -50) p.x = window.innerWidth + 50;
        if (p.x > window.innerWidth + 50) p.x = -50;
        if (p.y < -50) p.y = window.innerHeight + 50;
        if (p.y > window.innerHeight + 50) p.y = -50;

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.35;
            const gradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            gradient.addColorStop(0, `rgba(0, 113, 227, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(40, 205, 65, ${opacity * 0.7})`);
            gradient.addColorStop(1, `rgba(0, 198, 255, ${opacity})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 4);
        glow.addColorStop(0, "rgba(0, 113, 227, 0.7)");
        glow.addColorStop(1, "rgba(0, 113, 227, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(0, 113, 227, 0.9)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        const baseY = window.innerHeight * (0.3 + w * 0.22);
        const offset = time * (w + 1) * 0.8;

        ctx.beginPath();
        const opacity = 0.08 + w * 0.02;
        ctx.strokeStyle = w % 2 === 0
          ? `rgba(0, 113, 227, ${opacity})`
          : `rgba(40, 205, 65, ${opacity})`;
        ctx.lineWidth = 1.2;

        for (let x = 0; x <= window.innerWidth; x += 4) {
          const y =
            baseY +
            Math.sin((x / 180) + offset + w) * 28 +
            Math.sin((x / 80) + offset * 1.3 + w * 0.5) * 14 +
            Math.cos((x / 260) + offset * 0.6 + w * 1.2) * 18;

          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", setSize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.85 }}
    />
  );
}
