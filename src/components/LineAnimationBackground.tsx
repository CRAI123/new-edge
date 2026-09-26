import { useEffect, useRef } from "react";

export default function LineAnimationBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999, radius: 200 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };
    
    const handleMouseLeave = () => {
      mouseRef.current.x = -9999;
      mouseRef.current.y = -9999;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

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

    const particleCount = Math.min(100, Math.floor((window.innerWidth * window.innerHeight) / 15000));
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseX: number;
      baseY: number;
    }[] = [];

    for (let i = 0; i < particleCount; i++) {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      particles.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
      });
    }

    const connectionDistance = 160;
    let time = 0;

    const render = () => {
      time += 0.005;
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Basic movement
        p.x += p.vx + Math.sin(time * 2 + i) * 0.2;
        p.y += p.vy + Math.cos(time * 1.7 + i * 0.8) * 0.15;

        // Mouse interaction (repel effect)
        const dxMouse = mouseRef.current.x - p.x;
        const dyMouse = mouseRef.current.y - p.y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
        
        if (distMouse < mouseRef.current.radius) {
          const forceDirectionX = dxMouse / distMouse;
          const forceDirectionY = dyMouse / distMouse;
          const force = (mouseRef.current.radius - distMouse) / mouseRef.current.radius;
          const pushX = forceDirectionX * force * 5;
          const pushY = forceDirectionY * force * 5;
          
          p.x -= pushX;
          p.y -= pushY;
        }

        // Screen boundaries
        if (p.x < -50) p.x = window.innerWidth + 50;
        if (p.x > window.innerWidth + 50) p.x = -50;
        if (p.y < -50) p.y = window.innerHeight + 50;
        if (p.y > window.innerHeight + 50) p.y = -50;

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.4;
            const gradient = ctx.createLinearGradient(p.x, p.y, p2.x, p2.y);
            gradient.addColorStop(0, `rgba(0, 113, 227, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(40, 205, 65, ${opacity * 0.8})`);
            gradient.addColorStop(1, `rgba(0, 198, 255, ${opacity})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }

        // Connect to mouse if close enough
        if (distMouse < connectionDistance * 1.5) {
          const opacity = (1 - distMouse / (connectionDistance * 1.5)) * 0.5;
          ctx.strokeStyle = `rgba(0, 113, 227, ${opacity})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.stroke();
        }

        // Draw particle
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5);
        glow.addColorStop(0, "rgba(0, 113, 227, 0.8)");
        glow.addColorStop(1, "rgba(0, 113, 227, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "rgba(0, 113, 227, 1)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw subtle waves
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        const baseY = window.innerHeight * (0.3 + w * 0.22);
        const offset = time * (w + 1) * 1.2;

        ctx.beginPath();
        const opacity = 0.1 + w * 0.03;
        ctx.strokeStyle = w % 2 === 0
          ? `rgba(0, 113, 227, ${opacity})`
          : `rgba(40, 205, 65, ${opacity})`;
        ctx.lineWidth = 1.5;

        for (let x = 0; x <= window.innerWidth; x += 5) {
          // Add slight mouse influence to waves
          const dxMouse = mouseRef.current.x - x;
          let y = baseY +
            Math.sin((x / 180) + offset + w) * 35 +
            Math.sin((x / 80) + offset * 1.3 + w * 0.5) * 18 +
            Math.cos((x / 260) + offset * 0.6 + w * 1.2) * 22;

          const dyMouse = mouseRef.current.y - y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
          
          if (distMouse < 250) {
             const influence = (250 - distMouse) / 250;
             y -= influence * 20 * Math.sign(dyMouse); // Push wave away from mouse
          }

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
      style={{ opacity: 0.95 }}
    />
  );
}
