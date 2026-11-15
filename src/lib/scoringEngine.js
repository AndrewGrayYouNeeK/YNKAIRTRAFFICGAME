// Scoring: efficiency-based with collision penalties
export function calculateScore(session) {
  let score = 0;

  // Base: successful landings
  score += session.successful_landings * 100;

  // Efficiency bonus: fast handoff sequences
  if (session.successful_landings > 0 && session.failed_landings === 0) {
    score += session.successful_landings * 50; // Perfect streak
  }

  // Emergency handling bonus
  score += session.emergencies_handled * 200;

  // Penalty: collisions (-500 each)
  score -= session.collisions * 500;

  // Penalty: separation violations (-50 each)
  score -= (session.separationViolations || 0) * 50;

  return Math.max(0, score);
}

export const LEADERBOARD_KEY = "atc_leaderboard";

function boardStorage(storage) {
  if (storage) return storage;
  if (typeof localStorage === "undefined") return null;
  return localStorage;
}

export function readLeaderboard(storage) {
  const store = boardStorage(storage);
  if (!store) return [];
  try {
    const data = store.getItem(LEADERBOARD_KEY);
    const parsed = data ? JSON.parse(data) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getLeaderboard() {
  return readLeaderboard();
}

export function addScoreToLeaderboard(name, score, stats, storage) {
  const store = boardStorage(storage);
  if (!store) return [];
  const board = readLeaderboard(store);
  board.push({
    name,
    score,
    timestamp: Date.now(),
    landings: stats.successful_landings,
    emergencies: stats.emergencies_handled,
  });
  board.sort((a, b) => b.score - a.score);
  const kept = board.slice(0, 50);
  store.setItem(LEADERBOARD_KEY, JSON.stringify(kept));
  return kept;
}

export function recordShiftScore(name, stats, status, storage) {
  const score = calculateScore(stats);
  if (status === "completed") addScoreToLeaderboard(name, score, stats, storage);
  return score;
}