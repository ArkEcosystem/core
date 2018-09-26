'use strict'

const apiHelpers = require('@arkecosystem/core-test-utils/lib/helpers/api')

class Helpers {
  async GET (endpoint, params = {}) {
    return this.request('GET', endpoint, params)
  }

  async POST (endpoint, params) {
    return this.request('POST', endpoint, params)
  }

  async request (method, path, params = {}) {
    const url = `http://localhost:4002/${path}`
    const server = require('@arkecosystem/core-container').resolvePlugin('p2p').server

    const headers = {
      nethash: 'd9acd04bde4234a81addb8482333b4ac906bed7be5a9970ce8ada428bd083192',
      port: 4000,
      version: '2.0.0'
    }

    return apiHelpers.request(server, method, url, headers, params)
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
