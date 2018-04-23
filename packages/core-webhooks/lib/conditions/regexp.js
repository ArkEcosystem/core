'use strict';

/**
 * [description]
 * @param  {[type]} input   [description]
 * @param  {[type]} pattern [description]
 * @return {[type]}         [description]
 */
module.exports = (input, pattern) => (new RegExp(pattern).test(input))
