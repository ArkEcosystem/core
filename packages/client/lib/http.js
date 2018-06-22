const { configManager } = require('@arkecosystem/crypto')
const axios = require('axios')

module.exports = class HttpClient {
  /**
   * @constructor
   * @param  {String} host
   * @param  {Number = 1} [apiVersion]
   */
  constructor (host, apiVersion = 1) {
    this.host = host.endsWith('/') ? host.slice(0, -1) : host

    if (host.length === 0) {
      throw new Error('An empty host is not permitted')
    }

    this.version = apiVersion
  }

  /**
   * Used to specify the API Version.
   * @param {Number} version
   */
  setVersion (version) {
    this.version = version
  }

  /**
   * Perform a HTTP GET request.
   * @param  {String} path
   * @param  {Object} params
   * @return {Promise}
   */
  get (path, params = {}) {
    return this.sendRequest('get', path, params)
  }

  /**
   * Perform a HTTP POST request.
   * @param  {String} path
   * @param  {Object} data
   * @return {Promise}
   */
  post (path, data = {}) {
    return this.sendRequest('post', path, data)
  }

  /**
   * Perform a HTTP PUT request.
   * @param  {String} path
   * @param  {Object} data
   * @return {Promise}
   */
  put (path, data = {}) {
    return this.sendRequest('put', path, data)
  }

  /**
   * Perform a HTTP PATCH request.
   * @param  {String} path
   * @param  {Object} data
   * @return {Promise}
   */
  patch (path, data = {}) {
    return this.sendRequest('patch', path, data)
  }

  /**
   * Perform a HTTP DELETE request.
   * @param  {String} path
   * @param  {Object} params
   * @return {Promise}
   */
  delete (path, params = {}) {
    return this.sendRequest('delete', path, params)
  }

  /**
   * Performs a request using the headers that are expected by the network.
   * @param  {String} method
   * @param  {String} path
   * @param  {Object} payload
   * @return {Promise}
   * @throws Will throw an error if the HTTP request fails.
   */
  sendRequest (method, path, payload) {
    const client = axios.create({
      baseURL: this.host,
      headers: {
        nethash: configManager.get('nethash'),
        version: configManager.get('pubKeyHash'),
        port: '1',
        'API-Version': this.version
      }
    })

    try {
      return client[method](path, payload)
    } catch (error) {
      throw error
    }
  }
}
