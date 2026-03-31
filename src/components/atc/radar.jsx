.atc-radar-container {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
  border: 2px solid #00d4ff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.15), inset 0 0 30px rgba(0, 212, 255, 0.05);
}

.atc-radar-canvas {
  width: 100%;
  height: 100%;
  display: block;
  user-select: none;
}

.radar-fog-overlay {
  position: absolute;
  inset: 0;
  background: rgba(180, 200, 220, 0.15);
  backdrop-filter: blur(4px);
  pointer-events: none;
  animation: fog-pulse 3s ease-in-out infinite;
}

@keyframes fog-pulse {
  0%, 100% { opacity: 0.1; }
  50% { opacity: 0.25; }
}

.altitude-ladder {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  font-family: monospace;
  font-size: 11px;
  text-align: right;
  padding: 4px;
  color: #00d4ff;
  background: rgba(10, 25, 41, 0.9);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 4px;
}

.altitude-step {
  padding: 2px 6px;
  transition: all 0.2s;
}

.altitude-step.safe { color: #00ff88; }
.altitude-step.caution { color: #ffaa00; }
.altitude-step.danger { color: #ff0000; }

@media (max-width: 768px) {
  .atc-radar-container {
    border-width: 1px;
  }
}