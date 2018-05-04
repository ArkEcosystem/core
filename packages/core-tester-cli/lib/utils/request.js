const axios = require('axios')
const config = require('../config')

module.exports = {
  get: (endpoint, isTransport) => {
    const baseUrl = isTransport ? config.baseUrlTransport : config.baseUrlApi
    return axios.get(baseUrl + endpoint, {
      headers: {
        nethash: 'd9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192',
        version: '1.0.1',
        port: 4000
      }
    })
  },
  post: (endpoint, data, isTransport) => {
    const baseUrl = isTransport ? config.baseUrlTransport : config.baseUrlApi
    return axios.post(baseUrl + endpoint, data, {
      headers: {
        nethash: 'd9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192',
        version: '1.0.1',
        port: 4000
      }
    })
  }
}
