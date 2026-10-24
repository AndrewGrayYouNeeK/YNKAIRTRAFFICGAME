// Schematic geography in nautical miles, airport at the origin, +x east, +y north.
// These are recognizable silhouettes for the scope, not navigational charts.

const CHARTS = {
  KLAX: {
    coast: [
      [[-18, -36], [-14, -22], [-8, -12], [-5, -2], [-7, 8], [-11, 16], [-8, 28], [-14, 38]],
      [[-5, -2], [2, 4], [6, 2], [4, -6]],
    ],
    fixes: [
      { id: "SMO", x: -6, y: 14 },
      { id: "SLI", x: 14, y: -18 },
      { id: "POM", x: 24, y: 16 },
    ],
  },
  EGLL: {
    coast: [
      [[-36, 18], [-20, 22], [-8, 16], [6, 20], [18, 14], [34, 18]],
    ],
    fixes: [
      { id: "BNN", x: -16, y: 8 },
      { id: "OCK", x: 4, y: -14 },
      { id: "LAM", x: 18, y: 6 },
    ],
  },
  VHHH: {
    coast: [
      [[-16, -8], [-10, -2], [-12, 8], [-4, 14], [6, 10], [14, 4], [10, -6], [2, -12], [-8, -12], [-16, -8]],
      [[18, 16], [26, 20], [30, 12], [24, 8], [18, 16]],
    ],
    fixes: [
      { id: "TD", x: -18, y: 4 },
      { id: "LIMES", x: 8, y: -16 },
    ],
  },
  NZQN: {
    coast: [
      [[-28, 8], [-18, 18], [-6, 22], [4, 14], [2, 4], [-8, -2], [-22, 0], [-28, 8]],
      [[8, -8], [18, -4], [26, -14], [16, -22], [6, -16], [8, -8]],
    ],
    fixes: [
      { id: "QN", x: 0, y: 12 },
      { id: "LAKE", x: -10, y: 6 },
    ],
  },
  VNLK: {
    coast: [
      [[-8, -34], [-14, -16], [-6, 0], [-12, 16], [-4, 34]],
      [[6, -30], [12, -10], [4, 8], [10, 28]],
    ],
    fixes: [
      { id: "LK", x: 0, y: 10 },
      { id: "VAL", x: 0, y: -14 },
    ],
  },
};

export function getScopeChart(airportId) {
  return CHARTS[airportId] || { coast: [], fixes: [] };
}
