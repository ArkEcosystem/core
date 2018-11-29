const app = require('@arkecosystem/core-container')

const config = app.resolvePlugin('config')

/**
 * Turns a "peer" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = model => {
  const peer = {
    ip: model.ip,
    port: +model.port,
    version: model.version,
    height: model.state ? model.state.height : model.height,
    status: model.status,
    os: model.os,
    latency: model.delay,
  }

  if (config.network.name !== 'mainnet') {
    peer.hashid = model.hashid || 'unknown'
  }

  return peer
}
