// ---------------------------------------------------------------------------
// Hex grid geometry — axial coordinate system (q, r)
// Flat-top hexagons oriented so rows offset horizontally.
// ---------------------------------------------------------------------------

export const HEX_SIZE = 70;
export const HEX_WIDTH = HEX_SIZE * Math.sqrt(3);
export const HEX_HEIGHT = HEX_SIZE * 2;

/**
 * Convert axial hex coordinates to pixel center position.
 * @param {number} q
 * @param {number} r
 * @param {number} [size=HEX_SIZE]
 * @returns {{ x: number, y: number }}
 */
export function hexToPixel(q, r, size = HEX_SIZE) {
  const x = size * Math.sqrt(3) * (q + r / 2);
  const y = size * (3 / 2) * r;
  return { x, y };
}

/**
 * Convert a pixel position to the nearest hex axial coordinates.
 * @param {number} x
 * @param {number} y
 * @param {number} [size=HEX_SIZE]
 * @returns {{ q: number, r: number }}
 */
export function pixelToHex(x, y, size = HEX_SIZE) {
  const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / size;
  const r = ((2 / 3) * y) / size;
  return roundHex(q, r);
}

/**
 * Round fractional axial hex coordinates to the nearest integer hex.
 * @param {number} q
 * @param {number} r
 * @returns {{ q: number, r: number }}
 */
export function roundHex(q, r) {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  let rs = Math.round(s);

  const qDiff = Math.abs(rq - q);
  const rDiff = Math.abs(rr - r);
  const sDiff = Math.abs(rs - s);

  if (qDiff > rDiff && qDiff > sDiff) {
    rq = -rr - rs;
  } else if (rDiff > sDiff) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

/**
 * Return the six neighbour coordinates of a hex.
 * @param {number} q
 * @param {number} r
 * @returns {{ q: number, r: number }[]}
 */
export function hexNeighbours(q, r) {
  const dirs = [
    [1, 0], [1, -1], [0, -1],
    [-1, 0], [-1, 1], [0, 1],
  ];
  return dirs.map(([dq, dr]) => ({ q: q + dq, r: r + dr }));
}

/**
 * Canonical string key for a hex coordinate pair, used as Map keys.
 * @param {number} q
 * @param {number} r
 * @returns {string}
 */
export function hexKey(q, r) {
  return `${q},${r}`;
}

/**
 * Parse a hex key string back into { q, r }.
 * @param {string} key
 * @returns {{ q: number, r: number }}
 */
export function parseHexKey(key) {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}
