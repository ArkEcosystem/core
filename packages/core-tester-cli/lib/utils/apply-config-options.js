const config = require('../config')

module.exports = (options) => {
  if (options.baseApi) {
    config.baseUrlApi = options.baseApi
  }
  if (options.baseP2p) {
    config.baseUrlP2P = options.baseP2p
  }
}
