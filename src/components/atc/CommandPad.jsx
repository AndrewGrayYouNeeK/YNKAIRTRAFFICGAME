import React from "react";
import { MicButton, SpeechStatus } from "./VoiceInput";
import { altitudeCommand, headingCommand, speedCommand } from "../../lib/commandPad";

const TURNS = [
  { id: "turn-left-30", label: "L30", delta: -30 },
  { id: "turn-left-10", label: "L10", delta: -10 },
  { id: "turn-right-10", label: "R10", delta: 10 },
  { id: "turn-right-30", label: "R30", delta: 30 },
];

export default function CommandPad({
  selectedPlane,
  activeRunway,
  onCommand,
  commandText,
  onCommandText,
  onSubmit,
  feedback,
  lastRadio,
}) {
  const armed = Boolean(selectedPlane);
  const heading = Math.round(selectedPlane?.actualHeading ?? selectedPlane?.heading ?? 0);
  const altitude = Math.round(selectedPlane?.altitude ?? 0);
  const speed = Math.round(selectedPlane?.speed ?? 0);
  const runway = selectedPlane?.runway || activeRunway;

  const send = (command) => {
    if (!armed || !command) return;
    onCommand(command);
  };

  let status = "Tap an aircraft. Commands land in this pad.";
  if (feedback) {
    status = `Heard: ${feedback.heard || "—"} · ${feedback.understood || "not recognized"}`;
    if (feedback.suggestion) status = `${status} · Try: ${feedback.suggestion}`;
  } else if (lastRadio) {
    status = `${lastRadio.source}: ${lastRadio.message}`;
  }

  return (
    <section className={`command-pad${armed ? " armed" : ""}`} data-testid="command-pad" aria-label="Aircraft commands">
      <div className="pad-title">
        <strong data-testid="pad-callsign">{armed ? selectedPlane.callsign : "NO TARGET"}</strong>
        <span>{armed ? `HDG ${heading}  ALT ${altitude}  ${speed}KT` : "TAP THE SCOPE"}</span>
      </div>

      <div className="pad-row" data-coach="heading">
        {TURNS.map((turn) => (
          <button
            key={turn.id}
            type="button"
            className="pad-btn"
            data-testid={turn.id}
            disabled={!armed}
            onClick={() => send(headingCommand(selectedPlane, turn.delta))}
          >
            {turn.label}
          </button>
        ))}
      </div>

      <div className="pad-row two" data-coach="altitude">
        <button
          type="button"
          className="pad-btn"
          data-testid="descend"
          disabled={!armed}
          onClick={() => send(altitudeCommand(selectedPlane, -1000))}
        >
          DESCEND
        </button>
        <button
          type="button"
          className="pad-btn"
          data-testid="climb"
          disabled={!armed}
          onClick={() => send(altitudeCommand(selectedPlane, 1000))}
        >
          CLIMB
        </button>
      </div>

      <div className="pad-row two" data-coach="speed">
        <button
          type="button"
          className="pad-btn"
          data-testid="slower"
          disabled={!armed}
          onClick={() => send(speedCommand(selectedPlane, -20))}
        >
          SLOWER
        </button>
        <button
          type="button"
          className="pad-btn"
          data-testid="faster"
          disabled={!armed}
          onClick={() => send(speedCommand(selectedPlane, 20))}
        >
          FASTER
        </button>
      </div>

      <div className="pad-row two">
        <button
          type="button"
          className="pad-btn land"
          data-coach="land"
          data-testid="clear-to-land"
          disabled={!armed}
          onClick={() => send({ type: "cleared_to_land", runway })}
        >
          CLEARED TO LAND
        </button>
        <button
          type="button"
          className="pad-btn go"
          data-testid="go-around"
          disabled={!armed}
          onClick={() => send({ type: "go_around" })}
        >
          GO AROUND
        </button>
      </div>

      <form className="command-box" data-testid="command-form" data-coach="command" onSubmit={onSubmit}>
        <div className="command-row">
          <input
            id="atc-command"
            data-testid="command-input"
            value={commandText}
            onChange={(event) => onCommandText(event.target.value)}
            placeholder={armed ? `${selectedPlane.callsign} heading 250` : "CALLSIGN heading 250"}
            autoComplete="off"
            aria-label="Typed clearance"
          />
          <MicButton />
          <button type="submit">SEND</button>
        </div>
      </form>

      <div className="pad-status" data-testid="pad-status">
        <SpeechStatus />
        <p>{status}</p>
      </div>
      <p className="pad-keys">KEYS ← → ±10 · SHIFT ±30 · ↑↓ 1000FT · − + SPEED · L LAND · G AROUND</p>
    </section>
  );
}
