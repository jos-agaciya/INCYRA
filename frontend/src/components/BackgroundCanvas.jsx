import React, { useEffect, useRef } from 'react';

/**
 * INCYRA Background Canvas
 * Renders an ultra-subtle, modern ambient background with depth, geometric grid lines,
 * and soft ambient lighting for the AI Incident Command Center.
 */
export default function BackgroundCanvas({ theme = 'dark' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let time = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const isDark = theme === 'dark';

      if (!prefersReducedMotion) {
        time += 0.008;
      }

      // 1. Dynamic floating ambient glows (Deep Cyan, Indigo, and Subtle Teal)
      const orb1X = width * 0.82 + Math.sin(time * 0.7) * 70;
      const orb1Y = height * 0.18 + Math.cos(time * 0.5) * 50;
      const glow1 = ctx.createRadialGradient(orb1X, orb1Y, 0, orb1X, orb1Y, 520);
      if (isDark) {
        glow1.addColorStop(0, 'rgba(56, 189, 248, 0.055)');
        glow1.addColorStop(0.5, 'rgba(14, 165, 233, 0.025)');
        glow1.addColorStop(1, 'rgba(56, 189, 248, 0)');
      } else {
        glow1.addColorStop(0, 'rgba(2, 132, 199, 0.05)');
        glow1.addColorStop(1, 'rgba(2, 132, 199, 0)');
      }
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const orb2X = width * 0.18 + Math.cos(time * 0.6) * 60;
      const orb2Y = height * 0.42 + Math.sin(time * 0.8) * 50;
      const glow2 = ctx.createRadialGradient(orb2X, orb2Y, 0, orb2X, orb2Y, 580);
      if (isDark) {
        glow2.addColorStop(0, 'rgba(99, 102, 241, 0.04)');
        glow2.addColorStop(0.6, 'rgba(79, 70, 229, 0.015)');
        glow2.addColorStop(1, 'rgba(99, 102, 241, 0)');
      } else {
        glow2.addColorStop(0, 'rgba(99, 102, 241, 0.035)');
        glow2.addColorStop(1, 'rgba(99, 102, 241, 0)');
      }
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      const orb3X = width * 0.65 + Math.sin(time * 0.5) * 80;
      const orb3Y = height * 0.84 + Math.cos(time * 0.7) * 45;
      const glow3 = ctx.createRadialGradient(orb3X, orb3Y, 0, orb3X, orb3Y, 480);
      if (isDark) {
        glow3.addColorStop(0, 'rgba(16, 185, 129, 0.035)');
        glow3.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        glow3.addColorStop(0, 'rgba(16, 185, 129, 0.03)');
        glow3.addColorStop(1, 'rgba(16, 185, 129, 0)');
      }
      ctx.fillStyle = glow3;
      ctx.fillRect(0, 0, width, height);

      // 2. High-precision geometric matrix dot grid
      const gridSize = 44;
      const dotColor = isDark ? 'rgba(255, 255, 255, 0.032)' : 'rgba(0, 0, 0, 0.035)';
      ctx.fillStyle = dotColor;

      for (let x = gridSize; x < width; x += gridSize) {
        for (let y = gridSize; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 0.9, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Telemetry audio waveform wave in bottom corner
      const waveStartX = width * 0.04;
      const waveStartY = height * 0.93;
      const waveWidth = Math.min(320, width * 0.28);
      const waveTime = time * 2.5;

      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.14)' : 'rgba(2, 132, 199, 0.16)';
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let x = 0; x < waveWidth; x += 3) {
        const normalizedX = x / waveWidth;
        const envelope = Math.sin(normalizedX * Math.PI);
        const yOffset =
          Math.sin(normalizedX * 12 + waveTime) *
          Math.cos(normalizedX * 7 - waveTime * 0.4) *
          11 *
          envelope;
        if (x === 0) ctx.moveTo(waveStartX + x, waveStartY + yOffset);
        else ctx.lineTo(waveStartX + x, waveStartY + yOffset);
      }
      ctx.stroke();

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="background-canvas-container" aria-hidden="true">
      <canvas id="incyra-canvas" ref={canvasRef} />
    </div>
  );
}
