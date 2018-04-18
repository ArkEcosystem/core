'use strict';

/**
 * [description]
 * @param  {[type]} model [description]
 * @return {[type]}       [description]
 */
module.exports = (model) => {
  return {
    ip: model.ip,
    port: model.port,
    version: model.version,
    height: model.height,
    status: model.status,
    latency: model.delay
  }
}
