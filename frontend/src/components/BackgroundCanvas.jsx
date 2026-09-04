import React, { useEffect, useRef } from 'react';

/**
 * INCYRA Background Canvas
 * Renders domain-specific 3D & abstract operational incident elements:
 * 1. Floating AI Core (rotating wireframe geodesic orb with pulsing center)
 * 2. Network Nodes & Topology Graph (representing services, databases, gateway)
 * 3. Live Voice Waveform (sine audio spectrum representing the voice incident room)
 * 4. Infrastructure/Server Modules (subtle translucent stacked server blade silhouettes)
 * 5. Data Stream Particles (traveling along network paths)
 * 6. Incident Pulse (expanding alarm ring around the affected payment gateway node)
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

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Fixed network topology representing incident infrastructure
    const nodes = [
      { id: 'gw', xRatio: 0.28, yRatio: 0.38, label: 'API INGRESS', isIncidentNode: true },
      { id: 'db1', xRatio: 0.18, yRatio: 0.62, label: 'DB PRIMARY', isIncidentNode: false },
      { id: 'db2', xRatio: 0.12, yRatio: 0.78, label: 'DB REPLICA', isIncidentNode: false },
      { id: 'auth', xRatio: 0.42, yRatio: 0.28, label: 'AUTH SRV', isIncidentNode: false },
      { id: 'cache', xRatio: 0.38, yRatio: 0.52, label: 'CACHE LAYER', isIncidentNode: false },
      { id: 'mon', xRatio: 0.22, yRatio: 0.22, label: 'TELEMETRY', isIncidentNode: false },
    ];

    const connections = [
      ['gw', 'db1'],
      ['db1', 'db2'],
      ['gw', 'auth'],
      ['gw', 'cache'],
      ['mon', 'gw'],
      ['mon', 'db1'],
    ];

    // Data stream particles flowing along connections
    const particles = Array.from({ length: 14 }, (_, i) => ({
      connectionIndex: i % connections.length,
      progress: Math.random(),
      speed: 0.0015 + Math.random() * 0.002,
    }));

    let orbAngle = 0;
    let wavePhase = 0;
    let pulseRadius = 15;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isDark = theme === 'dark';

      // -------------------------------------------------------------
      // PALETTES: Strictly controlled monochromatic + subtle accents
      // -------------------------------------------------------------
      const nodeFill = isDark ? 'rgba(243, 244, 246, 0.5)' : 'rgba(30, 41, 59, 0.45)';
      const nodeIncidentFill = isDark ? 'rgba(239, 68, 68, 0.85)' : 'rgba(220, 38, 38, 0.75)';
      const lineStroke = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
      const textFill = isDark ? 'rgba(156, 163, 175, 0.4)' : 'rgba(75, 85, 99, 0.45)';
      const rackFill = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.025)';
      const rackBorder = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
      const particleColor = isDark ? 'rgba(56, 189, 248, 0.6)' : 'rgba(100, 116, 139, 0.5)';
      const pulseStroke = isDark ? 'rgba(239, 68, 68, ' : 'rgba(220, 38, 38, ';

      // -------------------------------------------------------------
      // 1. INFRASTRUCTURE / SERVER RACKS SILHOUETTES (Right & Lower Background)
      // -------------------------------------------------------------
      const rackStartX = width * 0.72;
      const rackStartY = height * 0.25;
      const rackW = 160;
      const rackH = 340;

      ctx.fillStyle = rackFill;
      ctx.strokeStyle = rackBorder;
      ctx.lineWidth = 1;

      // Draw subtle dual rack frames
      for (let r = 0; r < 2; r++) {
        const rx = rackStartX + r * 190;
        ctx.strokeRect(rx, rackStartY, rackW, rackH);
        ctx.fillRect(rx, rackStartY, rackW, rackH);

        // Server blade slots
        for (let b = 0; b < 9; b++) {
          const by = rackStartY + 14 + b * 35;
          ctx.strokeRect(rx + 8, by, rackW - 16, 26);
          // Blade LED indicator
          ctx.fillStyle = isDark
            ? (b === 2 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.25)')
            : (b === 2 ? 'rgba(220, 38, 38, 0.35)' : 'rgba(100, 116, 139, 0.3)');
          ctx.beginPath();
          ctx.arc(rx + rackW - 24, by + 13, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // -------------------------------------------------------------
      // 2. NETWORK TOPOLOGY NODES & INTERCONNECTS
      // -------------------------------------------------------------
      const nodePosMap = {};
      nodes.forEach((n) => {
        nodePosMap[n.id] = {
          x: n.xRatio * width,
          y: n.yRatio * height,
        };
      });

      // Draw network links
      ctx.strokeStyle = lineStroke;
      ctx.lineWidth = 1;
      connections.forEach(([sourceId, targetId]) => {
        const p1 = nodePosMap[sourceId];
        const p2 = nodePosMap[targetId];
        if (p1 && p2) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });

      // -------------------------------------------------------------
      // 3. DATA STREAM PARTICLES
      // -------------------------------------------------------------
      if (!prefersReducedMotion) {
        particles.forEach((p) => {
          p.progress += p.speed;
          if (p.progress > 1) p.progress = 0;

          const [sId, tId] = connections[p.connectionIndex];
          const p1 = nodePosMap[sId];
          const p2 = nodePosMap[tId];
          if (p1 && p2) {
            const px = p1.x + (p2.x - p1.x) * p.progress;
            const py = p1.y + (p2.y - p1.y) * p.progress;

            ctx.fillStyle = particleColor;
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // -------------------------------------------------------------
      // 4. NODES & INCIDENT PULSE
      // -------------------------------------------------------------
      nodes.forEach((n) => {
        const pos = nodePosMap[n.id];
        if (!pos) return;

        if (n.isIncidentNode) {
          // Animated Incident Pulse Ring
          if (!prefersReducedMotion) {
            pulseRadius = (pulseRadius + 0.35) % 45;
          }
          const pulseAlpha = Math.max(0, 1 - pulseRadius / 45) * 0.45;

          ctx.strokeStyle = `${pulseStroke}${pulseAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 14 + pulseRadius, 0, Math.PI * 2);
          ctx.stroke();

          // Core node
          ctx.fillStyle = nodeIncidentFill;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = nodeFill;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Label
        ctx.fillStyle = textFill;
        ctx.font = '9px monospace';
        ctx.fillText(n.label, pos.x + 8, pos.y + 3);
      });

      // -------------------------------------------------------------
      // 5. FLOATING AI CORE (Top Right Orbiting Orb)
      // -------------------------------------------------------------
      const orbCenterX = width * 0.82;
      const orbCenterY = height * 0.22;
      const orbRadius = 60;

      if (!prefersReducedMotion) {
        orbAngle += 0.006;
      }

      ctx.save();
      ctx.translate(orbCenterX, orbCenterY);

      // Outer rings of the AI core
      for (let i = 0; i < 3; i++) {
        const ringAngle = orbAngle * (i % 2 === 0 ? 1 : -0.75) + (i * Math.PI) / 3;
        ctx.strokeStyle = isDark
          ? `rgba(56, 189, 248, ${0.12 - i * 0.02})`
          : `rgba(100, 116, 139, ${0.14 - i * 0.03})`;
        ctx.lineWidth = 1.2;

        ctx.beginPath();
        ctx.ellipse(0, 0, orbRadius, orbRadius * 0.4, ringAngle, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Glowing central AI intelligence core
      const coreGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 28);
      if (isDark) {
        coreGrad.addColorStop(0, 'rgba(56, 189, 248, 0.25)');
        coreGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      } else {
        coreGrad.addColorStop(0, 'rgba(100, 116, 139, 0.22)');
        coreGrad.addColorStop(1, 'rgba(100, 116, 139, 0)');
      }
      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 28, 0, Math.PI * 2);
      ctx.fill();

      // Core point
      ctx.fillStyle = isDark ? 'rgba(56, 189, 248, 0.8)' : 'rgba(71, 85, 105, 0.8)';
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // -------------------------------------------------------------
      // 6. LIVE VOICE WAVEFORM (Bottom Left Floating Audio Spectrum)
      // -------------------------------------------------------------
      const waveStartX = width * 0.08;
      const waveStartY = height * 0.88;
      const waveWidth = Math.min(320, width * 0.3);

      if (!prefersReducedMotion) {
        wavePhase += 0.04;
      }

      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(100, 116, 139, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();

      for (let x = 0; x < waveWidth; x += 3) {
        const normalizedX = x / waveWidth;
        const envelope = Math.sin(normalizedX * Math.PI); // tapering envelope
        const yOffset =
          Math.sin(normalizedX * 18 + wavePhase) *
          Math.cos(normalizedX * 10 - wavePhase * 0.5) *
          16 *
          envelope;
        if (x === 0) ctx.moveTo(waveStartX + x, waveStartY + yOffset);
        else ctx.lineTo(waveStartX + x, waveStartY + yOffset);
      }
      ctx.stroke();

      // Text label for waveform
      ctx.fillStyle = textFill;
      ctx.font = '8px monospace';
      ctx.fillText('INCYRA VOICE STREAM // 48kHz PCM', waveStartX, waveStartY + 24);

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
