'use strict';

/**
 * [description]
 * @param  {Object} model
 * @return {Object}
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
