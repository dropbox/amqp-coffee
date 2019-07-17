/**
 * Get a random element from `array`
 *
 * @export
 * @template T
 * @param {T[]} array the array
 * @param {number} [from=0] start index
 * @returns {T}
 */
export function sample<T>(array: T[], from: number = 0): T {
  const length = array.length;
  if (from >= length) {
    throw new Error('out of range error');
  }

  return array[from + Math.floor(Math.random() * (length - from))];
}
