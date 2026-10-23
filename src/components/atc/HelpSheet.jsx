import React from "react";
import { CHEAT_SHEET, VOICE_TIPS } from "../../lib/tutorial";

export default function HelpSheet({ open, onClose, onReplay }) {
  if (!open) return null;
  return (
    <div className="modal-overlay help-overlay" data-testid="help-sheet">
      <div className="modal help-modal">
        <h2>HELP AND CHEAT SHEET</h2>
        <div className="briefing-content">
          <p>Select an aircraft on the scope, then use a slider (release to send) or type a clearance. Replace CALLSIGN with the label on the target, such as UAL123.</p>
          <div className="tutorial-sheet">
            {CHEAT_SHEET.map((row) => (
              <p key={row.phrase}><span>{row.intent}</span> {row.phrase}</p>
            ))}
          </div>
          <p className="tutorial-kicker">VOICE, IF YOU WANT IT</p>
          <ul className="tutorial-tips">
            {VOICE_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </div>
        <div className="tutorial-actions">
          <button type="button" className="btn-start" onClick={onClose}>CLOSE</button>
          {onReplay && (
            <button type="button" className="btn-shift" data-testid="help-replay" onClick={onReplay}>
              REPLAY TUTORIAL
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
