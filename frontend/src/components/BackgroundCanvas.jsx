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

      // 1. Subtle radial ambient glows
      const glow1 = ctx.createRadialGradient(width * 0.85, height * 0.15, 0, width * 0.85, height * 0.15, 450);
      if (isDark) {
        glow1.addColorStop(0, 'rgba(56, 189, 248, 0.045)');
        glow1.addColorStop(1, 'rgba(56, 189, 248, 0)');
      } else {
        glow1.addColorStop(0, 'rgba(100, 116, 139, 0.05)');
        glow1.addColorStop(1, 'rgba(100, 116, 139, 0)');
      }
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 0, width * 0.15, height * 0.85, 500);
      if (isDark) {
        glow2.addColorStop(0, 'rgba(16, 185, 129, 0.03)');
        glow2.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        glow2.addColorStop(0, 'rgba(148, 163, 184, 0.04)');
        glow2.addColorStop(1, 'rgba(148, 163, 184, 0)');
      }
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);

      // 2. Subtle geometric matrix dot grid
      const gridSize = 48;
      const dotColor = isDark ? 'rgba(255, 255, 255, 0.035)' : 'rgba(0, 0, 0, 0.04)';
      ctx.fillStyle = dotColor;

      for (let x = gridSize; x < width; x += gridSize) {
        for (let y = gridSize; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 3. Faint live audio telemetry waveform at bottom corner
      if (!prefersReducedMotion) {
        time += 0.03;
      }
      const waveStartX = width * 0.05;
      const waveStartY = height * 0.92;
      const waveWidth = Math.min(280, width * 0.25);

      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(100, 116, 139, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let x = 0; x < waveWidth; x += 3) {
        const normalizedX = x / waveWidth;
        const envelope = Math.sin(normalizedX * Math.PI);
        const yOffset =
          Math.sin(normalizedX * 14 + time) *
          Math.cos(normalizedX * 8 - time * 0.5) *
          12 *
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
