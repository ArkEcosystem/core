'use strict';

/**
 * [description]
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
module.exports = (value) => (value === '::1' || value === '127.0.0.1' || value === '::ffff:127.0.0.1')
