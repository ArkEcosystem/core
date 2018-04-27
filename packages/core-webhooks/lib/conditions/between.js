'use strict';

/**
 * Check if the given value is between min and max.
 * @param  {Number} input
 * @param  {Number} min
 * @param  {Number} max
 * @return {Boolean}
 */
module.exports = (input, min, max) => (input > min && input < max)
