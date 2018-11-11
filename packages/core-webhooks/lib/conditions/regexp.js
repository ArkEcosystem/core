/**
 * Check if the given value matches.
 * @param  {*} actual
 * @param  {String} expected
 * @return {Boolean}
 */
module.exports = (actual, expected) => new RegExp(expected).test(actual)
