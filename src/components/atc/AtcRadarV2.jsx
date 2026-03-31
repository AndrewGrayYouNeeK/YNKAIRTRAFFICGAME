import React, { useRef, useEffect, useState } from "react";

const GRID_SIZE = 500; // px
const MAX_RANGE = 50; // nm
const PX_PER_NM = GRID_SIZE / (2 * MAX_RANGE);

export default function AtcRadarV2({
  aircraft,
  wind,
  selectedPlane,
  onSelectPlane,
  onDragPlane,
  weatherEffects,
}) {
  const canvasRef = useRef(null);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = GRID_SIZE / 2;
    const centerY = GRID_SIZE / 2;

    // Clear
    ctx.fillStyle = "#0a1929";
    ctx.fillRect(0, 0, GRID_SIZE, GRID_SIZE);

    // Grid rings (cyan glow)
    ctx.strokeStyle = "#00d4ff";
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.2;
    for (let i = 1; i <= 4; i++) {
      const r = (i * MAX_RANGE * PX_PER_NM) / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#00d4ff";
      ctx.font = "10px monospace";
      ctx.fillText(`${i * 10}nm`, centerX + r + 2, centerY - 10);
    }

    // Crosshair
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = "#00d4ff";
    ctx.beginPath();
    ctx.moveTo(centerX, 10);
    ctx.lineTo(centerX, GRID_SIZE - 10);
    ctx.moveTo(10, centerY);
    ctx.lineTo(GRID_SIZE - 10, centerY);
    ctx.stroke();

    // Cardinal directions
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#00d4ff";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("N", centerX, 15);
    ctx.fillText("S", centerX, GRID_SIZE - 5);
    ctx.textAlign = "start";
    ctx.fillText("E", GRID_SIZE - 15, centerY + 4);
    ctx.textAlign = "end";
    ctx.fillText("W", 15, centerY + 4);

    // Airport center
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(centerX - 2, centerY - 8, 4, 16);
    ctx.fillRect(centerX - 8, centerY - 2, 16, 4);

    // Wind vector overlay
    if (wind && wind.speed > 0) {
      const windRad = (wind.direction * Math.PI) / 180;
      const windVecX = Math.cos(windRad) * 40;
      const windVecY = Math.sin(windRad) * 40;
      ctx.strokeStyle = "#ffaa00";
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY - 60);
      ctx.lineTo(centerX + windVecX, centerY - 60 + windVecY);
      ctx.stroke();
      // Arrowhead
      const angle = Math.atan2(windVecY, windVecX);
      ctx.beginPath();
      ctx.moveTo(centerX + windVecX, centerY - 60 + windVecY);
      ctx.lineTo(
        centerX + windVecX - 8 * Math.cos(angle - Math.PI / 6),
        centerY - 60 + windVecY - 8 * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        centerX + windVecX - 8 * Math.cos(angle + Math.PI / 6),
        centerY - 60 + windVecY - 8 * Math.sin(angle + Math.PI / 6)
      );
      ctx.fill();
    }

    // Aircraft
    ctx.globalAlpha = 1;
    aircraft.forEach((plane) => {
      const x = centerX + (plane.x * PX_PER_NM) / MAX_RANGE;
      const y = centerY - (plane.y * PX_PER_NM) / MAX_RANGE;

      if (x < 0 || x > GRID_SIZE || y < 0 || y > GRID_SIZE) return;

      // Trajectory
      if (plane.trajectory && plane.trajectory.length > 1) {
        ctx.strokeStyle =
          plane.collisionWarning || plane.separationViolation ? "#ff4444" : "#00ff88";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        plane.trajectory.forEach((pt, i) => {
          const ptX = centerX + (pt.x * PX_PER_NM) / MAX_RANGE;
          const ptY = centerY - (pt.y * PX_PER_NM) / MAX_RANGE;
          if (i === 0) ctx.moveTo(ptX, ptY);
          else ctx.lineTo(ptX, ptY);
        });
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Collision pulse
      if (plane.collisionWarning) {
        ctx.strokeStyle = "#ff0000";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        const pulse = Math.sin(Date.now() / 150) * 8 + 12;
        ctx.beginPath();
        ctx.arc(x, y, pulse, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Aircraft icon (colored jet)
      const isSelected = selectedPlane?.id === plane.id;
      const color = plane.collisionWarning
        ? "#ff0000"
        : plane.separationViolation
          ? "#ffaa00"
          : plane.mustLandASAP
            ? "#ff00ff"
            : isSelected
              ? "#ffff00"
              : "#00d4ff";

      ctx.fillStyle = color;
      ctx.font = isSelected ? "bold 10px monospace" : "9px monospace";

      // Draw tiny jet triangle
      const hdgRad = (plane.actualHeading * Math.PI) / 180;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(hdgRad);
      ctx.fillRect(-1.5, -3, 3, 6);
      ctx.fillRect(-3, 0, 6, 1.5);
      ctx.restore();

      // Callsign + altitude
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.fillText(plane.callsign, x + 6, y - 4);
      ctx.font = "8px monospace";
      ctx.fillText(`FL${Math.round(plane.altitude / 100)}`, x + 6, y + 6);

      // Speed vector
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      const speedVec = 5;
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(hdgRad) * speedVec, y + Math.sin(hdgRad) * speedVec);
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }, [aircraft, wind, selectedPlane, weatherEffects]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = GRID_SIZE / 2;
    const centerY = GRID_SIZE / 2;

    aircraft.forEach((plane) => {
      const planeX = centerX + (plane.x * PX_PER_NM) / MAX_RANGE;
      const planeY = centerY - (plane.y * PX_PER_NM) / MAX_RANGE;

      const dist = Math.sqrt((x - planeX) ** 2 + (y - planeY) ** 2);
      if (dist < 8) {
        onSelectPlane(plane);
      }
    });
  };

  return (
    <div className="atc-radar-container">
      <canvas
        ref={canvasRef}
        width={GRID_SIZE}
        height={GRID_SIZE}
        onClick={handleCanvasClick}
        className="atc-radar-canvas"
        style={{ cursor: "crosshair" }}
      />
      {weatherEffects?.lowVis && (
        <div className="radar-fog-overlay"></div>
      )}
    </div>
  );
}