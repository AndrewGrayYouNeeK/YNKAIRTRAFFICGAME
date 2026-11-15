export function pauseForBackground(state, states) {
  if (!states || state !== states.active) return { state, automatic: false };
  return { state: states.paused, automatic: true };
}
