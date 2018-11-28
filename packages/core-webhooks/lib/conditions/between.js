/**
 * Check if the given value is between min and max.
 * @param  {*} actual
 * @param  {*} expected
 * @return {Boolean}
 */
module.exports = (actual, expected) => actual > expected.min && actual < expected.max
