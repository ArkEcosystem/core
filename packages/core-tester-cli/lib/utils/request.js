const axios = require('axios')

module.exports = (config) => {
  const headers = {}
  if (config && config.network) {
    headers.nethash = config.network.nethash
    headers.version = '2.0.0'
    headers.port = config.p2pPort
  }

  return {
    get: async (endpoint, isP2P) => {
      const baseUrl = `${config.baseUrl}:${isP2P ? config.p2pPort : config.apiPort}`

      return (await axios.get(baseUrl + endpoint, { headers })).data
    },
    post: async (endpoint, data, isP2P) => {
      const baseUrl = `${config.baseUrl}:${isP2P ? config.p2pPort : config.apiPort}`

      return (await axios.post(baseUrl + endpoint, data, { headers })).data
    }
  }
}
