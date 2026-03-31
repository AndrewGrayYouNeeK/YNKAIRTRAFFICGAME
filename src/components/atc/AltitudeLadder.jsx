import React from "react";

export default function AltitudeLadder({ selectedPlane }) {
  if (!selectedPlane) return null;

  const altitudes = [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000];
  const current = Math.round(selectedPlane.altitude / 100) * 100;
  const desired = selectedPlane.desiredAltitude;

  return (
    <div className="altitude-ladder">
      <div style={{ fontSize: "9px", marginBottom: "8px", color: "#ffaa00" }}>
        {selectedPlane.callsign}
      </div>
      {altitudes.map((alt) => {
        let status = "safe";
        if (Math.abs(alt - current) < 1000) status = "caution";
        if (Math.abs(alt - current) < 500) status = "danger";

        return (
          <div key={alt} className={`altitude-step ${status}`}>
            {alt === current && "▶ "}
            FL{Math.round(alt / 100)}
          </div>
        );
      })}
      {desired && (
        <div style={{ fontSize: "9px", marginTop: "8px", color: "#00ff88" }}>
          T: FL{Math.round(desired / 100)}
        </div>
      )}
    </div>
  );
}