const config = require('../config')

module.exports = (options) => {
  if (options.baseApi) {
    config.baseUrlApi = options.baseApi.replace(/\/+$/, '')
  }

  if (options.baseP2p) {
    config.baseUrlP2P = options.baseP2p.replace(/\/+$/, '')

    const port = config.baseUrlP2P.match(/:\d+/)
    if (port.length === 2) {
      config.requestHeaders.port = config.baseUrlP2P.match(/:\d+/)
    } else if (config.baseUrlApi.indexOf('https://')) {
      config.requestHeaders.port = 443
    } else {
      config.requestHeaders.port = 80
    }
  }

  if (options.passphrase) {
    config.passphrase = options.passphrase
  }

  if (options.publicKeyHash) {
    config.publicKeyHash = +options.publicKeyHash
  }

  if (options.nethash) {
    config.requestHeaders.nethash = options.nethash
  }
}
