const axios = require('axios')
const config = require('../config')

module.exports = {
  get: (endpoint, isTransport) => {
    const baseUrl = isTransport ? config.baseUrlP2P : config.baseUrlApi

    return axios.get(baseUrl + endpoint, {
      headers: config.requestHeaders
    })
  },
  post: (endpoint, data, isTransport) => {
    const baseUrl = isTransport ? config.baseUrlP2P : config.baseUrlApi

    return axios.post(baseUrl + endpoint, data, {
      headers: config.requestHeaders
    })
  }
}
