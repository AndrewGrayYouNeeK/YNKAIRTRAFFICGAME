import React, { useEffect, useRef, useState } from "react";
import { SEPARATION_FT, SEPARATION_NM, mapPointerToCanvas, physicalRunways } from "../../lib/atcPhysics";
import { getScopeChart } from "../../lib/scopeChart";

const MAX_RANGE_NM = 40;
const HIT_RADIUS = 28;

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

function targetColor(plane, selected, now) {
  if (plane.emergency) return Math.floor(now / 280) % 2 === 0 ? "#ff5a5a" : "#ffc1c1";
  if (selected) return "#ffd15a";
  if (plane.clearedToLand || plane.status === "final") return "#8ef6ff";
  if (plane.altitude < 10000) return "#b6ff8a";
  return "#e7fff2";
}

function runwayPixels(runway, pxPerNm) {
  const lateralNm = runway.lateral || 0;
  const lateral = lateralNm === 0 ? 0 : Math.sign(lateralNm) * Math.max(Math.abs(lateralNm) * pxPerNm, 22);
  return { half: Math.max(0.9 * pxPerNm, 26), lateral };
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function placeDataBlock(x, y, block, placed, size) {
  const offsets = [
    [16, -block.h - 6],
    [16, 12],
    [-block.w - 16, -block.h - 6],
    [-block.w - 16, 12],
    [16, -18],
    [-block.w - 16, -18],
  ];
  for (let i = 0; i < offsets.length; i += 1) {
    const rect = {
      x: Math.round(x + offsets[i][0]),
      y: Math.round(y + offsets[i][1]),
      w: block.w,
      h: block.h,
    };
    const inside = rect.x >= 6 && rect.y >= 6 && rect.x + rect.w <= size - 6 && rect.y + rect.h <= size - 6;
    const symbol = { x: x - 14, y: y - 14, w: 28, h: 28 };
    const clear = inside && !rectsOverlap(rect, symbol) && placed.every((other) => !rectsOverlap(rect, other));
    if (clear) return rect;
  }
  return {
    x: Math.round(Math.min(size - block.w - 6, Math.max(6, x + 16))),
    y: Math.round(Math.min(size - block.h - 6, Math.max(6, y - block.h - 6))),
    w: block.w,
    h: block.h,
  };
}

function drawCoast(ctx, chart, center, pxPerNm) {
  ctx.save();
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = "rgba(120, 176, 148, 0.55)";
  ctx.fillStyle = "rgba(18, 48, 36, 0.35)";
  (chart.coast || []).forEach((ring) => {
    if (ring.length < 2) return;
    ctx.beginPath();
    ring.forEach((point, index) => {
      const x = center + point[0] * pxPerNm;
      const y = center - point[1] * pxPerNm;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    if (ring.length > 2 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]) {
      ctx.fill();
    }
    ctx.stroke();
  });
  ctx.fillStyle = "rgba(186, 255, 214, 0.7)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  (chart.fixes || []).forEach((fix) => {
    const x = Math.round(center + fix.x * pxPerNm);
    const y = Math.round(center - fix.y * pxPerNm);
    ctx.beginPath();
    ctx.moveTo(x, y - 4);
    ctx.lineTo(x + 4, y);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x - 4, y);
    ctx.closePath();
    ctx.strokeStyle = "rgba(186, 255, 214, 0.8)";
    ctx.stroke();
    ctx.fillText(fix.id, x, y - 10);
  });
  ctx.restore();
}

function drawCompass(ctx, center, size) {
  const outer = size / 2 - 6;
  ctx.save();
  ctx.strokeStyle = "rgba(150, 255, 190, 0.35)";
  ctx.fillStyle = "rgba(210, 255, 226, 0.8)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 1;
  for (let deg = 0; deg < 360; deg += 10) {
    const rad = toRadians(deg);
    const inner = outer - (deg % 30 === 0 ? 9 : 4);
    ctx.beginPath();
    ctx.moveTo(center + Math.sin(rad) * inner, center - Math.cos(rad) * inner);
    ctx.lineTo(center + Math.sin(rad) * outer, center - Math.cos(rad) * outer);
    ctx.stroke();
    if (deg % 30 === 0) {
      const labelR = outer - 16;
      const lx = Math.round(center + Math.sin(rad) * labelR);
      const ly = Math.round(center - Math.cos(rad) * labelR);
      ctx.fillText(String(deg).padStart(3, "0"), lx, ly);
    }
  }
  ctx.restore();
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
  touchdown,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const sweepRef = useRef(0);
  const historyRef = useRef(new Map());
  const aircraftRef = useRef(aircraft);
  const selectedRef = useRef(selectedPlane);
  const windRef = useRef(wind);
  const airportRef = useRef(airport);
  const runwayRef = useRef(activeRunway);
  const touchdownRef = useRef(touchdown);
  const [size, setSize] = useState(64);

  aircraftRef.current = aircraft;
  selectedRef.current = selectedPlane;
  windRef.current = wind;
  airportRef.current = airport;
  runwayRef.current = activeRunway;
  touchdownRef.current = touchdown;

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
      const now = performance.now();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const targets = aircraftRef.current || [];
      const selected = selectedRef.current;
      const windNow = windRef.current;
      const field = airportRef.current;
      const active = runwayRef.current;
      const pixelW = Math.floor(size * dpr);
      if (canvas.width !== pixelW || canvas.height !== pixelW) {
        canvas.width = pixelW;
        canvas.height = pixelW;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const center = size / 2;
      const pxPerNm = (size / 2 - 28) / MAX_RANGE_NM;
      const background = ctx.createRadialGradient(center, center, size * 0.05, center, center, size * 0.72);
      background.addColorStop(0, "#0a2a18");
      background.addColorStop(1, "#020806");
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, size, size);

      drawCoast(ctx, getScopeChart(field?.id), center, pxPerNm);

      ctx.lineWidth = 1;
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      for (let ring = 5; ring <= MAX_RANGE_NM; ring += 5) {
        const major = ring % 10 === 0;
        ctx.strokeStyle = major ? "rgba(110, 230, 160, 0.38)" : "rgba(110, 230, 160, 0.14)";
        ctx.beginPath();
        ctx.arc(center, center, ring * pxPerNm, 0, Math.PI * 2);
        ctx.stroke();
        if (major) {
          ctx.fillStyle = "rgba(190, 255, 214, 0.75)";
          ctx.fillText(String(ring), Math.round(center + 4), Math.round(center - ring * pxPerNm - 2));
        }
      }
      drawCompass(ctx, center, size);

      const runways = physicalRunways(field?.runways || []);
      runways.forEach((runway) => {
        const isActive = runway.id === active || runway.reciprocal === active;
        const drawn = runwayPixels(runway, pxPerNm);
        const half = drawn.half;
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(toRadians(runway.heading));
        ctx.translate(drawn.lateral, 0);
        if (isActive) {
          ctx.beginPath();
          ctx.moveTo(-2, half);
          ctx.lineTo(-1.5 * pxPerNm, half + 12 * pxPerNm);
          ctx.lineTo(1.5 * pxPerNm, half + 12 * pxPerNm);
          ctx.closePath();
          ctx.fillStyle = "rgba(80, 255, 190, 0.08)";
          ctx.fill();
          ctx.setLineDash([2, 5]);
          ctx.strokeStyle = "rgba(140, 255, 210, 0.8)";
          ctx.beginPath();
          ctx.moveTo(0, half);
          ctx.lineTo(0, half + 18 * pxPerNm);
          ctx.stroke();
          ctx.setLineDash([]);
          [10, 20].forEach((mark) => {
            const my = half + mark * pxPerNm;
            ctx.strokeStyle = "rgba(180, 255, 220, 0.7)";
            ctx.strokeRect(-3, my - 3, 6, 6);
          });
        }
        ctx.fillStyle = isActive ? "#f4fff8" : "#6e8578";
        ctx.fillRect(-3, -half, 6, half * 2);
        ctx.fillStyle = isActive ? "#9bffc8" : "#42584c";
        ctx.fillRect(-7, half - 3, 14, 3);
        ctx.restore();
      });

      const chartLabels = [];
      const drawTag = (text, x, y) => {
        ctx.font = "bold 11px ui-monospace, monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const width = Math.ceil(ctx.measureText(text).width + 8);
        let rect = { x: Math.round(x - width / 2), y: Math.round(y - 7), w: width, h: 14 };
        for (let nudge = 0; nudge < 5 && chartLabels.some((other) => rectsOverlap(rect, other)); nudge += 1) {
          rect = { ...rect, y: rect.y + 12 };
        }
        chartLabels.push(rect);
        const tx = rect.x + rect.w / 2;
        const ty = rect.y + 7;
        ctx.lineWidth = 3;
        ctx.strokeStyle = "rgba(2, 8, 6, 0.9)";
        ctx.strokeText(text, tx, ty);
        ctx.fillStyle = "#f3fff7";
        ctx.fillText(text, tx, ty);
      };
      runways.forEach((runway) => {
        const heading = toRadians(runway.heading);
        const cos = Math.cos(heading);
        const sin = Math.sin(heading);
        const drawn = runwayPixels(runway, pxPerNm);
        const placeEnd = (designator, sign) => {
          const ly = sign * (drawn.half + 14);
          drawTag(designator, center + drawn.lateral * cos - ly * sin, center + drawn.lateral * sin + ly * cos);
        };
        placeEnd(runway.id, 1);
        if (runway.showReciprocal) placeEnd(runway.reciprocal, -1);
      });

      sweepRef.current = (now / 45) % 360;
      const sweep = toRadians(sweepRef.current) - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, size / 2 - 8, sweep - 0.45, sweep, false);
      ctx.closePath();
      ctx.fillStyle = "rgba(120, 255, 180, 0.07)";
      ctx.fill();

      if (frame % 5 === 0) {
        const seen = new Set();
        targets.forEach((plane) => {
          if (plane.status === "landed") return;
          seen.add(plane.id);
          const trail = historyRef.current.get(plane.id) || [];
          trail.push({ x: plane.x, y: plane.y });
          historyRef.current.set(plane.id, trail.slice(-6));
        });
        [...historyRef.current.keys()].forEach((id) => {
          if (!seen.has(id)) historyRef.current.delete(id);
        });
      }

      const violatingIds = new Set();
      const pairs = [];
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
            pairs.push([a, b]);
          }
        }
      }
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255, 80, 80, 0.85)";
      ctx.lineWidth = 1.4;
      pairs.forEach(([a, b]) => {
        ctx.beginPath();
        ctx.moveTo(center + a.x * pxPerNm, center - a.y * pxPerNm);
        ctx.lineTo(center + b.x * pxPerNm, center - b.y * pxPerNm);
        ctx.stroke();
      });
      ctx.restore();

      const placed = [...chartLabels, { x: size - 124, y: 2, w: 122, h: 18 }];
      const labelFont = size < 280 ? "10px ui-monospace, monospace" : "11px ui-monospace, monospace";
      targets.forEach((plane) => {
        if (plane.status === "landed") return;
        const x = center + plane.x * pxPerNm;
        const y = center - plane.y * pxPerNm;
        if (x < -30 || x > size + 30 || y < -30 || y > size + 30) return;
        const color = targetColor(plane, selected?.id === plane.id, now);
        const trail = historyRef.current.get(plane.id) || [];
        trail.forEach((point, index) => {
          const tx = center + point.x * pxPerNm;
          const ty = center - point.y * pxPerNm;
          ctx.fillStyle = `rgba(180, 255, 210, ${0.15 + index / 10})`;
          ctx.beginPath();
          ctx.arc(tx, ty, 1.6, 0, Math.PI * 2);
          ctx.fill();
        });

        const leadNm = Math.min(6, (plane.speed || 0) / 60);
        const hdg = toRadians(plane.actualHeading || plane.heading || 0);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.75;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.sin(hdg) * leadNm * pxPerNm, y - Math.cos(hdg) * leadNm * pxPerNm);
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (selected?.id === plane.id) {
          ctx.strokeStyle = "rgba(255, 209, 90, 0.55)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, SEPARATION_NM * pxPerNm, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (violatingIds.has(plane.id)) {
          const pulse = 16 + Math.sin(now / 180) * 3;
          ctx.strokeStyle = "rgba(255, 64, 64, 0.95)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(x, y, pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hdg);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(4, 5);
        ctx.lineTo(0, 2);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, 1);
        ctx.lineTo(6, 1);
        ctx.stroke();
        ctx.restore();

        const lines = [
          plane.callsign,
          `${Math.round(plane.altitude)} ${trendSymbol(plane)}`,
          `${Math.round(plane.speed)}KT`,
        ];
        ctx.font = `bold ${labelFont}`;
        const width = Math.ceil(Math.max(...lines.map((line) => ctx.measureText(line).width)) + 8);
        const block = placeDataBlock(x, y, { w: width, h: 36 }, placed, size);
        placed.push(block);
        ctx.strokeStyle = "rgba(160, 255, 200, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(block.x < x ? block.x + block.w : block.x, block.y + 8);
        ctx.stroke();
        ctx.fillStyle = "rgba(2, 10, 6, 0.78)";
        ctx.fillRect(block.x, block.y, block.w, block.h);
        ctx.fillStyle = color;
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        lines.forEach((line, index) => {
          ctx.fillText(line, block.x + 4, block.y + 12 + index * 11);
        });
      });

      const flash = touchdownRef.current;
      if (flash?.at) {
        const age = (now - flash.at) / 1000;
        if (age >= 0 && age < 2.5) {
          const radius = 8 + age * 36;
          ctx.strokeStyle = `rgba(255, 230, 140, ${1 - age / 2.5})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(center, center, radius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      ctx.fillStyle = "rgba(190, 255, 214, 0.85)";
      ctx.font = "bold 11px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(field?.id ? `${field.id} TERMINAL` : "TERMINAL", 10, 16);

      if (windNow?.speed > 0) {
        const blow = toRadians((windNow.direction + 180) % 360);
        ctx.strokeStyle = "#ffc14a";
        ctx.fillStyle = "#ffc14a";
        ctx.lineWidth = 1.5;
        ctx.font = "10px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(`WND ${Math.round(windNow.direction)}/${Math.round(windNow.speed)}`, size - 12, 15);
        ctx.beginPath();
        ctx.moveTo(size - 112, 11);
        ctx.lineTo(size - 112 + Math.sin(blow) * 10, 11 - Math.cos(blow) * 10);
        ctx.stroke();
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
    const pxPerNm = (size / 2 - 28) / MAX_RANGE_NM;
    let closest = null;
    let minDist = HIT_RADIUS;
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
        border: "1px solid rgba(120, 255, 170, 0.45)",
        borderRadius: 10,
        overflow: "hidden",
        background: "#020806",
        boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.45)",
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
