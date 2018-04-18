const configManager = require('../managers/config')
const axios = require('axios')

module.exports = class HttpClient {
  /**
   * @constructor
   * @param  {String} host    [description]
   * @param  {[type]} version [description]
   */
  constructor (host, version) {
    this.host = host.endsWith('/') ? host.slice(0, -1) : host
    this.version = version
  }

  /**
   * [setVersion description]
   * @param {[type]} version [description]
   */
  setVersion (version) {
    this.version = version
  }

  /**
   * [get description]
   * @param  {String} path   [description]
   * @param  {Object} params [description]
   * @return {[type]}        [description]
   */
  get (path, params = {}) {
    return this.sendRequest('get', path, params)
  }

  /**
   * [post description]
   * @param  {String} path [description]
   * @param  {Object} data [description]
   * @return {[type]}      [description]
   */
  post (path, data = {}) {
    return this.sendRequest('post', path, data)
  }

  /**
   * [put description]
   * @param  {String} path [description]
   * @param  {Object} data [description]
   * @return {[type]}      [description]
   */
  put (path, data = {}) {
    return this.sendRequest('put', path, data)
  }

  /**
   * [patch description]
   * @param  {String} path [description]
   * @param  {Object} data [description]
   * @return {[type]}      [description]
   */
  patch (path, data = {}) {
    return this.sendRequest('patch', path, data)
  }

  /**
   * [delete description]
   * @param  {String} path   [description]
   * @param  {Object} params [description]
   * @return {[type]}        [description]
   */
  delete (path, params = {}) {
    return this.sendRequest('delete', path, params)
  }

  /**
   * Performs a request, using the headers that are expected by the network
   * @param  {String} method  [description]
   * @param  {String} path    [description]
   * @param  {[type]} payload [description]
   * @return {[type]}         [description]
   */
  sendRequest (method, path, payload) {
    const client = axios.create({
      baseURL: this.host,
      headers: {
        nethash: configManager.get('nethash'),
        version: configManager.get('version'),
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
