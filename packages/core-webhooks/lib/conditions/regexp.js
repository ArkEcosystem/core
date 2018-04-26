'use strict';

/**
 * [description]
 * @param  {*} input
 * @param  {String} pattern
 * @return {Boolean}
 */
module.exports = (input, pattern) => (new RegExp(pattern).test(input))
