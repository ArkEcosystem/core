'use strict'

/**
 * Turns a "peer" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  return {
    ip: model.ip,
    port: +model.port,
    version: model.version,
    height: model.state ? model.state.height : model.height,
    status: model.status,
    os: model.os,
    latency: model.delay
  }
}
