'use strict';

const between = require('./between')

/**
 * [description]
 * @param  {[type]} input [description]
 * @param  {[type]} min   [description]
 * @param  {[type]} max   [description]
 * @return {[type]}       [description]
 */
module.exports = (input, min, max) => (!between(input, min, max))
