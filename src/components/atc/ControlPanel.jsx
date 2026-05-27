import React, { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

export default function ControlPanel({ selectedPlane, onCommand }) {
  const [speed, setSpeed] = useState(selectedPlane?.desiredSpeed || 250);
  const [altitude, setAltitude] = useState(selectedPlane?.desiredAltitude || 5000);
  const [heading, setHeading] = useState(selectedPlane?.desiredHeading || 0);

  useEffect(() => {
    if (!selectedPlane) return;
    setSpeed(Math.round(selectedPlane.desiredSpeed || selectedPlane.speed || 250));
    setAltitude(Math.round(selectedPlane.desiredAltitude || selectedPlane.altitude || 5000));
    setHeading(Math.round(selectedPlane.desiredHeading || selectedPlane.actualHeading || 0));
  }, [selectedPlane]);

  const handleSpeedChange = (e) => {
    const val = parseInt(e.target.value);
    setSpeed(val);
    onCommand({ type: "set_speed", value: val });
  };

  const handleAltitudeChange = (e) => {
    const val = parseInt(e.target.value);
    setAltitude(val);
    onCommand({ type: "set_altitude", value: val });
  };

  const handleGoAround = () => {
    onCommand({ type: "go_around" });
  };

  const handleHeadingChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setHeading(val);
    onCommand({ type: "set_heading", value: val });
  };

  const handleClearedToLand = () => {
    onCommand({ type: "cleared_to_land" });
  };

  if (!selectedPlane) {
    return (
      <div className="control-panel empty">
        <p className="text-muted-foreground font-mono text-xs">Click aircraft to select</p>
      </div>
    );
  }

  return (
    <div className="control-panel">
      <div className="panel-header">
        <div className="font-mono font-bold text-sm">{selectedPlane.callsign}</div>
        {selectedPlane.emergency && (
          <div className="emergency-badge">
            <AlertTriangle className="w-3 h-3" />
            {selectedPlane.emergency.type}
          </div>
        )}
      </div>

      {/* Current state */}
      <div className="state-grid">
        <div>
          <span className="label">ALT</span>
          <span className="value">FL{Math.round(selectedPlane.altitude / 100)}</span>
        </div>
        <div>
          <span className="label">SPD</span>
          <span className="value">{selectedPlane.speed} kt</span>
        </div>
        <div>
          <span className="label">HDG</span>
          <span className="value">{Math.round(selectedPlane.actualHeading)}°</span>
        </div>
      </div>

      {/* Commands */}
      <div className="commands-section">
        <div className="command-group">
          <label className="command-label">Heading (HDG)</label>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={heading}
            onChange={handleHeadingChange}
            className="slider"
          />
          <span className="slider-value">{heading}°</span>
        </div>

        <div className="command-group">
          <label className="command-label">Altitude</label>
          <input
            type="range"
            min="1000"
            max="35000"
            step="500"
            value={altitude}
            onChange={handleAltitudeChange}
            className="slider"
          />
          <span className="slider-value">{altitude} ft</span>
        </div>

        <div className="command-group">
          <label className="command-label">Speed</label>
          <input
            type="range"
            min="100"
            max={selectedPlane.maxSpeed || 450}
            step="10"
            value={speed}
            onChange={handleSpeedChange}
            className="slider"
          />
          <span className="slider-value">{speed} kt</span>
        </div>

        <button className="cmd-btn go-around" onClick={handleGoAround}>
          ⤴ GO AROUND
        </button>
        <button className="cmd-btn clear-land" onClick={handleClearedToLand}>
          ✅ CLEARED TO LAND
        </button>
      </div>

      {/* Emergency info */}
      {selectedPlane.emergency && (
        <div className="emergency-info">
          <p className="text-red-400 text-xs font-mono">{selectedPlane.emergency.message}</p>
        </div>
      )}
    </div>
  );
}

const style = `
.control-panel {
  background: rgba(10, 25, 41, 0.95);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 8px;
  padding: 12px;
  font-family: monospace;
  font-size: 11px;
  color: #00d4ff;
}

.control-panel.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
}

.emergency-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background: rgba(255, 0, 0, 0.2);
  border: 1px solid #ff0000;
  border-radius: 4px;
  color: #ff6666;
  font-size: 9px;
}

.state-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 10px;
  padding: 8px;
  background: rgba(0, 212, 255, 0.05);
  border-radius: 4px;
}

.state-grid > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  color: rgba(0, 212, 255, 0.6);
  font-size: 8px;
}

.value {
  color: #00ff88;
  font-weight: bold;
}

.commands-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.command-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.command-label {
  color: rgba(0, 212, 255, 0.6);
  font-size: 9px;
}

.slider {
  width: 100%;
  height: 4px;
  background: rgba(0, 212, 255, 0.1);
  border-radius: 2px;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  background: #00d4ff;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
}

.slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: #00d4ff;
  border-radius: 50%;
  cursor: pointer;
  border: none;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
}

.slider-value {
  font-size: 9px;
  color: #00ff88;
}

.cmd-btn {
  padding: 6px 10px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid #00d4ff;
  border-radius: 4px;
  color: #00d4ff;
  font-family: monospace;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.cmd-btn:hover {
  background: rgba(0, 212, 255, 0.2);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.4);
}

.cmd-btn.go-around {
  border-color: #ffaa00;
  color: #ffaa00;
}

.cmd-btn.go-around:hover {
  background: rgba(255, 170, 0, 0.2);
  box-shadow: 0 0 12px rgba(255, 170, 0, 0.4);
}

.cmd-btn.clear-land {
  border-color: #00ff88;
  color: #00ff88;
}

.cmd-btn.clear-land:hover {
  background: rgba(0, 255, 136, 0.2);
  box-shadow: 0 0 12px rgba(0, 255, 136, 0.4);
}

.emergency-info {
  margin-top: 10px;
  padding: 8px;
  background: rgba(255, 0, 0, 0.1);
  border-left: 2px solid #ff0000;
  border-radius: 2px;
}
`;

if (typeof document !== "undefined") {
  const styleEl = document.createElement("style");
  styleEl.textContent = style;
  document.head.appendChild(styleEl);
}