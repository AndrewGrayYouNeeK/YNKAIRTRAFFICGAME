import React, { useEffect, useRef, useState } from "react";

const MAX_RANGE_NM = 50;
const RUNWAY_HEADING = 280;

const toRadians = (deg) => (deg * Math.PI) / 180;
const lateralDistance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export default function AtcRadarV2({
  aircraft,
  wind,
  selectedPlane,
  onSelectPlane,
  weatherEffects,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const sweepRef = useRef(0);
  const [size, setSize] = useState(500);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const resizeObserver = new ResizeObserver(([entry]) => {
      const next = Math.max(260, Math.floor(Math.min(entry.contentRect.width, entry.contentRect.height || entry.contentRect.width)));
      setSize(next);
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    canvas.width = size;
    canvas.height = size;
  }, [size]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let rafId;

    const draw = () => {
      frame += 1;
      const center = size / 2;
      const pxPerNm = (size / 2 - 20) / MAX_RANGE_NM;
      ctx.fillStyle = "#0a1929";
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = "rgba(0,212,255,0.25)";
      for (let i = 1; i <= 5; i += 1) {
        ctx.beginPath();
        ctx.arc(center, center, i * 10 * pxPerNm, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(center, 10);
      ctx.lineTo(center, size - 10);
      ctx.moveTo(10, center);
      ctx.lineTo(size - 10, center);
      ctx.stroke();

      // Runway
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(toRadians(RUNWAY_HEADING));
      ctx.fillStyle = "#fff";
      ctx.fillRect(-6, -50, 12, 100);
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px monospace";
      ctx.fillText("28L", center - 30, center + 62);
      ctx.fillText("10R", center + 10, center - 55);

      // ILS cone
      const finalPlanes = aircraft.some((plane) => plane.status === "final" || plane.status === "cleared_to_land");
      if (finalPlanes) {
        const thresholdX = center + Math.cos(toRadians(RUNWAY_HEADING)) * 48;
        const thresholdY = center + Math.sin(toRadians(RUNWAY_HEADING)) * 48;
        const coneLen = 15 * pxPerNm;
        const left = toRadians(RUNWAY_HEADING + 180 - 3);
        const right = toRadians(RUNWAY_HEADING + 180 + 3);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = "rgba(0,255,255,0.7)";
        ctx.beginPath();
        ctx.moveTo(thresholdX, thresholdY);
        ctx.lineTo(thresholdX + Math.cos(left) * coneLen, thresholdY + Math.sin(left) * coneLen);
        ctx.moveTo(thresholdX, thresholdY);
        ctx.lineTo(thresholdX + Math.cos(right) * coneLen, thresholdY + Math.sin(right) * coneLen);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Radar sweep + persistence trail
      sweepRef.current = (sweepRef.current + 0.8) % 360;
      trailRef.current = [...trailRef.current.slice(-18), sweepRef.current];
      trailRef.current.forEach((angle, index) => {
        const alpha = (index + 1) / (trailRef.current.length * 7);
        ctx.strokeStyle = `rgba(0,255,136,${alpha})`;
        ctx.lineWidth = index === trailRef.current.length - 1 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(
          center + Math.cos(toRadians(angle)) * (size / 2 - 10),
          center + Math.sin(toRadians(angle)) * (size / 2 - 10)
        );
        ctx.stroke();
      });

      // Violation pair lookup for pulsing rings
      const violatingIds = new Set();
      for (let i = 0; i < aircraft.length; i += 1) {
        for (let j = i + 1; j < aircraft.length; j += 1) {
          const a = aircraft[i];
          const b = aircraft[j];
          const closeLateral = lateralDistance(a, b) < 5;
          const closeVertical = Math.abs(a.altitude - b.altitude) <= 1000;
          if (closeLateral && closeVertical) {
            violatingIds.add(a.id);
            violatingIds.add(b.id);
          }
        }
      }

      aircraft.forEach((plane) => {
        const x = center + plane.x * pxPerNm;
        const y = center - plane.y * pxPerNm;
        if (x < 0 || x > size || y < 0 || y > size) return;

        let color = "#ffffff";
        if (plane.altitude < 10000) color = "#00ff88";
        else if (plane.altitude < 20000) color = "#00ffff";
        if (selectedPlane?.id === plane.id) color = "#ffee55";

        if (violatingIds.has(plane.id)) {
          const pulse = 12 + Math.sin(frame / 10) * 4;
          ctx.strokeStyle = "rgba(255,0,0,0.85)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Aircraft icon (triangle + wing stubs)
        const hdg = toRadians(plane.actualHeading || plane.heading || 0);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hdg);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(4, 5);
        ctx.lineTo(0, 3);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-6, -1);
        ctx.lineTo(6, -1);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = color;
        ctx.font = "10px monospace";
        ctx.fillText(plane.callsign, x + 8, y - 5);
        ctx.font = "9px monospace";
        ctx.fillText(`FL${Math.round(plane.altitude / 100)}`, x + 8, y + 7);
      });

      // Wind arrow
      if (wind?.speed > 0) {
        const wx = center + Math.cos(toRadians(wind.direction)) * 35;
        const wy = center + Math.sin(toRadians(wind.direction)) * 35;
        ctx.strokeStyle = "#ffaa00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center, 26);
        ctx.lineTo(wx, 26 + (wy - center));
        ctx.stroke();
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [aircraft, selectedPlane, size, wind]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const center = size / 2;
    const pxPerNm = (size / 2 - 20) / MAX_RANGE_NM;

    let closest = null;
    let minDist = 16;
    aircraft.forEach((plane) => {
      const planeX = center + plane.x * pxPerNm;
      const planeY = center - plane.y * pxPerNm;
      const dist = Math.hypot(x - planeX, y - planeY);
      if (dist < minDist) {
        minDist = dist;
        closest = plane;
      }
    });
    if (closest) onSelectPlane(closest);
  };

  return (
    <div
      ref={containerRef}
      className="atc-radar-container"
      style={{
        position: "relative",
        width: "100%",
        minHeight: "320px",
        border: "2px solid #00d4ff",
        borderRadius: 8,
        overflow: "hidden",
        background: "#0a1929",
      }}
    >
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onClick={handleCanvasClick}
        className="atc-radar-canvas"
        style={{ width: "100%", height: "100%", display: "block", cursor: "crosshair" }}
      />
      {weatherEffects?.lowVis && (
        <div
          className="radar-fog-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(180,200,220,0.12)",
            backdropFilter: "blur(2px)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
