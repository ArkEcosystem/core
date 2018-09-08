'use strict'

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

    // Build URL params from _params_ object for GET / DELETE requests
    const getParams = Object.entries(params).map(([key, val]) => `${key}=${val}`).join('&')

    // Injecting the request into Hapi server instead of using axios
    const injectOptions = {
      method,
      url: ['GET', 'DELETE'].includes(method) ? `${url}?${getParams}` : url,
      headers: {},
      payload: ['GET', 'DELETE'].includes(method) ? {} : params
    }

    const response = await server.inject(injectOptions)
    Object.assign(response, { data: response.result, status: response.statusCode })
    return response
  }
}

/**
 * @type {Helpers}
 */
module.exports = new Helpers()
