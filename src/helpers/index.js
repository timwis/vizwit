// Converts a value to an array, but only if it's defined already
export function arrayify (val) {
  return (val !== null && val !== undefined)
    ? [val]
    : undefined
}
