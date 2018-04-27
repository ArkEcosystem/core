'use strict';

/**
 * Blocks execution for the given value in milliseconds.
 * @param  {Number} ms
 * @return {Promise}
 */
module.exports = (ms) => new Promise(resolve => setTimeout(resolve, ms))
