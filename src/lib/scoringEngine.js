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

export function getLeaderboard() {
  if (typeof localStorage === "undefined") return [];
  const data = localStorage.getItem("atc_leaderboard");
  return data ? JSON.parse(data) : [];
}

export function addScoreToLeaderboard(name, score, stats) {
  const board = getLeaderboard();
  board.push({
    name,
    score,
    timestamp: Date.now(),
    landings: stats.successful_landings,
    emergencies: stats.emergencies_handled,
  });
  board.sort((a, b) => b.score - a.score);
  localStorage.setItem("atc_leaderboard", JSON.stringify(board.slice(0, 50)));
  return board;
}