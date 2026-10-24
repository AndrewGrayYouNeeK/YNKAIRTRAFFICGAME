import React, { useEffect, useState } from "react";
import { CHEAT_SHEET, TUTORIAL_STEPS, VOICE_TIPS } from "../../lib/tutorial";

function targetRect(name) {
  const node = document.querySelector(`[data-coach="${name}"]`);
  if (!node) return null;
  const box = node.getBoundingClientRect();
  if (box.width < 2 || box.height < 2) return null;
  return box;
}

export default function TutorialCoach({
  stepIndex,
  complete,
  example,
  feedback,
  onSkipVoice,
  onExit,
  onFinish,
  onPlayFree,
}) {
  const step = TUTORIAL_STEPS[stepIndex];
  const [primary, setPrimary] = useState(null);
  const [secondary, setSecondary] = useState(null);
  const [phrases, setPhrases] = useState(false);

  useEffect(() => {
    if (!step) return undefined;
    const measure = () => {
      setPrimary(targetRect(step.highlight));
      setSecondary(step.also ? targetRect(step.also) : null);
    };
    measure();
    const timer = setInterval(measure, 400);
    window.addEventListener("resize", measure);
    return () => {
      clearInterval(timer);
      window.removeEventListener("resize", measure);
    };
  }, [step]);

  if (complete) {
    return (
      <div className="tutorial-layer" data-testid="tutorial-complete">
        <div className="tutorial-card">
          <p className="tutorial-kicker">FIRST MISSION COMPLETE</p>
          <h2>You landed them.</h2>
          <p>The score is yours. Open HELP any time for the phrase list, or replay this lesson from the airport menu.</p>
          <div className="tutorial-actions">
            <button type="button" className="btn-start" onClick={onFinish}>AIRPORTS</button>
            <button type="button" className="btn-shift" onClick={onPlayFree}>FREE FLIGHT</button>
          </div>
        </div>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="tutorial-layer" data-testid="tutorial-coach" data-step={step.id}>
      {primary && (
        <div
          className="tutorial-ring"
          style={{ top: primary.top - 6, left: primary.left - 6, width: primary.width + 12, height: primary.height + 12 }}
        />
      )}
      {secondary && (
        <div
          className="tutorial-ring tutorial-ring-secondary"
          style={{ top: secondary.top - 6, left: secondary.left - 6, width: secondary.width + 12, height: secondary.height + 12 }}
        />
      )}
      <section className={`tutorial-card${phrases || step.id === "voice" ? " open" : ""}`}>
        <p className="tutorial-kicker">STEP {stepIndex + 1} OF {TUTORIAL_STEPS.length}</p>
        <h2 data-testid="tutorial-step-title">{step.title}</h2>
        <p>{step.body}</p>
        {example && (
          <p className="tutorial-example" data-testid="tutorial-example">
            Type: <strong>{example}</strong>
          </p>
        )}
        {step.id === "voice" && (
          <ul className="tutorial-tips">
            {VOICE_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        )}
        {phrases && (
          <div className="tutorial-sheet" data-testid="tutorial-cheatsheet">
            <p className="tutorial-kicker">PHRASE CHEAT SHEET</p>
            {CHEAT_SHEET.map((row) => (
              <p key={row.phrase}><span>{row.intent}</span> {row.phrase}</p>
            ))}
          </div>
        )}
        {feedback && (
          <div className="tutorial-feedback">
            <p>Heard: {feedback.heard || "—"}</p>
            <p>Understood: {feedback.understood || "not recognized"}</p>
            {feedback.suggestion && <p>Try: {feedback.suggestion}</p>}
          </div>
        )}
        <div className="tutorial-actions">
          {step.action === "voice-optional" && (
            <button type="button" className="btn-start" data-testid="tutorial-skip-voice" onClick={onSkipVoice}>
              CONTINUE WITHOUT VOICE
            </button>
          )}
          <button type="button" className="btn-help" data-testid="tutorial-phrases" onClick={() => setPhrases((open) => !open)}>
            {phrases ? "HIDE PHRASES" : "PHRASES"}
          </button>
          <button type="button" className="btn-shift" onClick={onExit}>EXIT TUTORIAL</button>
        </div>
      </section>
    </div>
  );
}
