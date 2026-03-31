.atc-v2-container {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: monospace;
  color: #00d4ff;
}

.atc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 2px solid rgba(0, 212, 255, 0.2);
  background: rgba(10, 25, 41, 0.9);
  flex-wrap: wrap;
  gap: 20px;
}

.header-left,
.header-right {
  display: flex;
  gap: 16px;
  align-items: center;
}

.airport-name {
  font-size: 24px;
  font-weight: bold;
  color: #00ff88;
  margin: 0;
}

.wind-indicator {
  display: flex;
  flex-direction: column;
  font-size: 11px;
}

.wind-indicator .value {
  color: #ffaa00;
  font-weight: bold;
}

.header-center {
  display: flex;
  gap: 24px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 212, 255, 0.05);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 4px;
}

.stat .label {
  font-size: 9px;
  color: rgba(0, 212, 255, 0.6);
}

.stat .value {
  font-size: 18px;
  font-weight: bold;
  color: #00ff88;
}

.btn-pause {
  padding: 8px 16px;
  background: rgba(255, 170, 0, 0.1);
  border: 1px solid #ffaa00;
  border-radius: 4px;
  color: #ffaa00;
  font-family: monospace;
  font-weight: bold;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-pause:hover {
  background: rgba(255, 170, 0, 0.2);
  box-shadow: 0 0 12px rgba(255, 170, 0, 0.4);
}

.atc-grid {
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 16px;
  padding: 16px;
  flex: 1;
  overflow: hidden;
}

.radar-section {
  display: grid;
  grid-template-columns: 1fr 60px;
  gap: 12px;
}

.control-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
}

.emergency-alert {
  background: rgba(255, 0, 0, 0.15);
  border: 2px solid #ff0000;
  border-radius: 6px;
  padding: 12px;
  animation: pulse 1s infinite;
}

.alert-title {
  font-weight: bold;
  color: #ff6666;
  font-size: 12px;
  margin-bottom: 6px;
}

.emergency-alert p {
  font-size: 11px;
  color: #ffcccc;
  margin: 0;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 0, 0, 0.5); }
  50% { box-shadow: 0 0 12px rgba(255, 0, 0, 0.5); }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: linear-gradient(135deg, #0a1929 0%, #1a2332 100%);
  border: 2px solid #00d4ff;
  border-radius: 8px;
  padding: 24px;
  max-width: 500px;
  box-shadow: 0 0 30px rgba(0, 212, 255, 0.3);
  text-align: center;
}

.modal h2 {
  color: #00ff88;
  margin-top: 0;
  font-size: 20px;
}

.briefing-content {
  text-align: left;
  font-size: 12px;
  margin: 16px 0;
  line-height: 1.6;
}

.briefing-content p {
  margin: 6px 0;
}

.wind-info {
  color: #ffaa00;
  font-weight: bold;
  margin-top: 12px;
}

.btn-start {
  margin-top: 16px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #00d4ff, #00ff88);
  border: none;
  border-radius: 6px;
  color: #0a1929;
  font-family: monospace;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-start:hover {
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.6);
}

@media (max-width: 1024px) {
  .atc-grid {
    grid-template-columns: 1fr;
  }

  .header-center {
    gap: 12px;
  }

  .stat .value {
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .atc-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .radar-section {
    grid-template-columns: 1fr;
  }

  .atc-grid {
    grid-template-columns: 1fr;
  }

  .airport-name {
    font-size: 18px;
  }

  .stat .value {
    font-size: 12px;
  }
}