const between = require('./between')

/**
 * Check if the given value is not between min and max.
 * @param  {Number} actual
 * @param  {Number} expected
 * @return {Boolean}
 */
module.exports = (actual, expected) => !between(actual, expected)
