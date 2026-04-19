/**
 * Merges style updates into a previous path style, handling nested
 * `spline` and `meander` sub-objects correctly.
 *
 * @param {object} prev     — existing style object
 * @param {object} updates  — partial updates to apply
 * @returns {object}        — new style object (prev is not mutated)
 */
export function mergeStyle(prev, updates) {
  return {
    ...prev,
    ...updates,
    spline: updates.spline
      ? { ...prev.spline,  ...updates.spline  }
      : prev.spline,
    meander: updates.meander
      ? { ...prev.meander, ...updates.meander }
      : prev.meander,
  };
}
