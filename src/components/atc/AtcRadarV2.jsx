import React, { useEffect, useRef, useState } from "react";
import { SEPARATION_FT, SEPARATION_NM, mapPointerToCanvas, physicalRunways } from "../../lib/atcPhysics";

const MAX_RANGE_NM = 40;

const toRadians = (deg) => (deg * Math.PI) / 180;

export function canvasPointFromEvent(event, canvas, size) {
  return mapPointerToCanvas(event.clientX, event.clientY, canvas.getBoundingClientRect(), size);
}

function trendSymbol(plane) {
  if ((plane.verticalSpeed || 0) > 80) return "↑";
  if ((plane.verticalSpeed || 0) < -80) return "↓";
  if ((plane.desiredAltitude || plane.altitude) > plane.altitude + 80) return "↑";
  if ((plane.desiredAltitude || plane.altitude) < plane.altitude - 80) return "↓";
  return "→";
}

export default function AtcRadarV2({
  aircraft,
  wind,
  selectedPlane,
  onSelectPlane,
  onScopeClick,
  weatherEffects,
  airport,
  activeRunway,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const trailRef = useRef([]);
  const sweepRef = useRef(0);
  const aircraftRef = useRef(aircraft);
  const selectedRef = useRef(selectedPlane);
  const windRef = useRef(wind);
  const airportRef = useRef(airport);
  const runwayRef = useRef(activeRunway);
  const [size, setSize] = useState(64);

  aircraftRef.current = aircraft;
  selectedRef.current = selectedPlane;
  windRef.current = wind;
  airportRef.current = airport;
  runwayRef.current = activeRunway;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      const available = height > 0 ? Math.min(width, height) : width;
      const next = Math.max(64, Math.floor(available || 64));
      setSize(next);
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let frame = 0;
    let rafId;

    const draw = () => {
      frame += 1;
      const dpr = window.devicePixelRatio || 1;
      const targets = aircraftRef.current || [];
      const selected = selectedRef.current;
      const windNow = windRef.current;
      const field = airportRef.current;
      const active = runwayRef.current;
      if (canvas.width !== Math.floor(size * dpr) || canvas.height !== Math.floor(size * dpr)) {
        canvas.width = Math.floor(size * dpr);
        canvas.height = Math.floor(size * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const center = size / 2;
      const pxPerNm = (size / 2 - 24) / MAX_RANGE_NM;
      ctx.fillStyle = "#071422";
      ctx.fillRect(0, 0, size, size);

      ctx.strokeStyle = "rgba(0,212,255,0.22)";
      ctx.lineWidth = 1;
      for (let ring = 10; ring <= MAX_RANGE_NM; ring += 10) {
        ctx.beginPath();
        ctx.arc(center, center, ring * pxPerNm, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(0,212,255,0.55)";
        ctx.font = "10px monospace";
        ctx.fillText(`${ring}`, center + 4, center - ring * pxPerNm + 12);
      }
      ctx.beginPath();
      ctx.moveTo(center, 16);
      ctx.lineTo(center, size - 16);
      ctx.moveTo(16, center);
      ctx.lineTo(size - 16, center);
      ctx.stroke();
      ctx.fillStyle = "#9ad7ff";
      ctx.font = "bold 12px monospace";
      ctx.fillText("N", center - 4, 14);

      const runways = physicalRunways(field?.runways || []);
      runways.forEach((runway) => {
        const isActive = runway.id === active || runway.reciprocal === active;
        const half = 0.9 * pxPerNm;
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(toRadians(runway.heading));
        ctx.translate(runway.lateral * pxPerNm, 0);
        ctx.fillStyle = isActive ? "#f4f7fb" : "#7f93a8";
        ctx.fillRect(-4, -half, 8, half * 2);
        if (isActive) {
          ctx.setLineDash([4, 6]);
          ctx.strokeStyle = "rgba(0,255,200,0.75)";
          ctx.beginPath();
          ctx.moveTo(0, half);
          ctx.lineTo(0, half + 15 * pxPerNm);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.fillStyle = isActive ? "#041018" : "#d5e6f2";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(runway.id, 0, half + 12);
        if (runway.showReciprocal) ctx.fillText(runway.reciprocal, 0, -half - 4);
        ctx.restore();
      });

      sweepRef.current = (sweepRef.current + 0.7) % 360;
      trailRef.current = [...trailRef.current.slice(-18), sweepRef.current];
      trailRef.current.forEach((angle, index) => {
        const alpha = (index + 1) / (trailRef.current.length * 8);
        ctx.strokeStyle = `rgba(0,255,136,${alpha})`;
        ctx.lineWidth = index === trailRef.current.length - 1 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(
          center + Math.sin(toRadians(angle)) * (size / 2 - 12),
          center - Math.cos(toRadians(angle)) * (size / 2 - 12)
        );
        ctx.stroke();
      });

      const violatingIds = new Set();
      for (let i = 0; i < targets.length; i += 1) {
        for (let j = i + 1; j < targets.length; j += 1) {
          const a = targets[i];
          const b = targets[j];
          if (a.status === "landed" || b.status === "landed") continue;
          const closeLateral = Math.hypot(a.x - b.x, a.y - b.y) < SEPARATION_NM;
          const closeVertical = Math.abs(a.altitude - b.altitude) < SEPARATION_FT;
          if (closeLateral && closeVertical) {
            violatingIds.add(a.id);
            violatingIds.add(b.id);
          }
        }
      }

      targets.forEach((plane) => {
        if (plane.status === "landed") return;
        const x = center + plane.x * pxPerNm;
        const y = center - plane.y * pxPerNm;
        if (x < -20 || x > size + 20 || y < -20 || y > size + 20) return;

        let color = "#ffffff";
        if (plane.altitude < 10000) color = "#00ff88";
        else if (plane.altitude < 20000) color = "#7ef6ff";
        if (plane.emergency) color = "#ff6666";
        if (selected?.id === plane.id) color = "#ffe14a";

        if (plane.trajectory?.length > 1) {
          ctx.beginPath();
          plane.trajectory.forEach((point, index) => {
            const tx = center + point.x * pxPerNm;
            const ty = center - point.y * pxPerNm;
            if (index === 0) ctx.moveTo(tx, ty);
            else ctx.lineTo(tx, ty);
          });
          ctx.strokeStyle = "rgba(255,255,255,0.25)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        if (selected?.id === plane.id) {
          ctx.strokeStyle = "rgba(0,212,255,0.45)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, SEPARATION_NM * pxPerNm, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (violatingIds.has(plane.id)) {
          const pulse = 14 + Math.sin(frame / 8) * 3;
          ctx.strokeStyle = "rgba(255,40,40,0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        const hdg = toRadians(plane.actualHeading || plane.heading || 0);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hdg);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(5, 6);
        ctx.lineTo(0, 3);
        ctx.lineTo(-5, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
        ctx.restore();

        const altText = `${Math.round(plane.altitude)}ft`;
        const speedText = `${Math.round(plane.speed)}kt ${trendSymbol(plane)}`;
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "left";
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(0,0,0,0.75)";
        ctx.strokeText(plane.callsign, x + 10, y - 8);
        ctx.strokeText(altText, x + 10, y + 4);
        ctx.strokeText(speedText, x + 10, y + 16);
        ctx.fillStyle = color;
        ctx.fillText(plane.callsign, x + 10, y - 8);
        ctx.font = "10px monospace";
        ctx.fillText(altText, x + 10, y + 4);
        ctx.fillText(speedText, x + 10, y + 16);
      });

      if (windNow?.speed > 0) {
        const blow = toRadians((windNow.direction + 180) % 360);
        const length = 18 + Math.min(windNow.speed, 40);
        const x2 = center + Math.sin(blow) * length;
        const y2 = 28 - Math.cos(blow) * (length * 0.35);
        ctx.strokeStyle = "#ffaa00";
        ctx.fillStyle = "#ffaa00";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(center, 28);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.font = "10px monospace";
        ctx.fillText(`WND ${Math.round(windNow.direction)}/${Math.round(windNow.speed)}`, center + 8, 42);
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [size]);

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const point = canvasPointFromEvent(event, canvas, size);
    const center = size / 2;
    const pxPerNm = (size / 2 - 24) / MAX_RANGE_NM;
    let closest = null;
    let minDist = 22;
    (aircraftRef.current || []).forEach((plane) => {
      if (plane.status === "landed") return;
      const planeX = center + plane.x * pxPerNm;
      const planeY = center - plane.y * pxPerNm;
      const dist = Math.hypot(point.x - planeX, point.y - planeY);
      if (dist < minDist) {
        minDist = dist;
        closest = plane;
      }
    });
    onScopeClick?.();
    if (closest) onSelectPlane?.(closest.id);
  };

  return (
    <div
      ref={containerRef}
      className="atc-radar-container"
      data-testid="atc-scope"
      data-coach="scope"
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        maxWidth: "100%",
        maxHeight: "100%",
        border: "2px solid #00d4ff",
        borderRadius: 8,
        overflow: "hidden",
        background: "#071422",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="atc-radar-canvas"
        style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: size, height: size, display: "block", cursor: "crosshair" }}
      />
      {weatherEffects?.lowVis && (
        <div
          className="radar-fog-overlay"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(180,200,220,0.18)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
