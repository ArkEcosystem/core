'use strict';

const between = require('./between')

/**
 * Check if the given value is not between min and max.
 * @param  {Number} input
 * @param  {Number} min
 * @param  {Number} max
 * @return {Boolean}
 */
module.exports = (input, min, max) => (!between(input, min, max))
