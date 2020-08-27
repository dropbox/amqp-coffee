/**
 * Get a random element from `array`
 *
 * @export
 * @template T
 * @param {T[]} array the array
 * @param {number} [from=0] start index
 * @returns {T}
 */
export function sample<T>(array: T[], from = 0): T {
  const length = array.length
  if (from >= length) {
    throw new Error('out of range error')
  }

  return array[from + Math.floor(Math.random() * (length - from))]
}

/**
 * Shuffle the array using the Fisher-Yates Shuffle.
 * This method will mutate the original array.
 *
 * @export
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
export function shuffle<T>(array: T[]): T[] {
  let counter = array.length

  // While there are elements in the array
  while (counter > 0) {
    // Pick a random index
    const index = Math.floor(Math.random() * counter)

    // Decrease counter by 1
    counter--;

    // And swap the last element with it
    [array[counter], array[index]] = [array[index], array[counter]]
  }

  return array
}