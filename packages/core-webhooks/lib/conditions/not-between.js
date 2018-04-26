'use strict';

const between = require('./between')

/**
 * [description]
 * @param  {Number} input
 * @param  {Number} min
 * @param  {Number} max
 * @return {Boolean}
 */
module.exports = (input, min, max) => (!between(input, min, max))
