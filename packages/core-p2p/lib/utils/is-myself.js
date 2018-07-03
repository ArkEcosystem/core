const os = require('os')
const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')

module.exports = function (peer) {
  const interfaces = os.networkInterfaces()

  return Object.keys(interfaces).some(function (family) {
    return interfaces[family].some(function (nic) {
      return nic.address === peer.ip && peer.port === config.server.port
    })
  })
}
