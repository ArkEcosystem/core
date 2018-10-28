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
    this.timeout = 60000
    this.headers = {}
  }

  /**
   * Used to specify the API Version.
   * @param {Number} version
   */
  setVersion (version) {
    this.version = version
  }

  /**
   * Establish the headers of the requests.
   * @param {Object} headers
   */
  setHeaders (headers = {}) {
    this.headers = headers
  }

  /**
   * Establish the timeout of the requests.
   * @param {Number} timeout
   */
  setTimeout (timeout) {
    this.timeout = timeout
  }

  /**
   * Perform a HTTP GET request.
   * @param  {String} path
   * @param  {Object} params
   * @return {Promise}
   */
  get (path, params = {}) {
    return this.sendApiRequest('get', path, { params })
  }

  /**
   * Perform a HTTP POST request.
   * @param  {String} path
   * @param  {Object} data
   * @return {Promise}
   */
  post (path, data = {}) {
    return this.sendApiRequest('post', path, data)
  }

  /**
   * Perform a HTTP PUT request.
   * @param  {String} path
   * @param  {Object} data
   * @return {Promise}
   */
  put (path, data = {}) {
    return this.sendApiRequest('put', path, data)
  }

  /**
   * Perform a HTTP PATCH request.
   * @param  {String} path
   * @param  {Object} data
   * @return {Promise}
   */
  patch (path, data = {}) {
    return this.sendApiRequest('patch', path, data)
  }

  /**
   * Perform a HTTP DELETE request.
   * @param  {String} path
   * @param  {Object} params
   * @return {Promise}
   */
  delete (path, params = {}) {
    return this.sendApiRequest('delete', path, { params })
  }

  /**
   * Performs a request to the API using the headers that are expected by the network.
   * @param  {String} method
   * @param  {String} path
   * @param  {Object} payload
   * @return {Promise}
   * @throws Will throw an error if the HTTP request fails.
   */
  sendApiRequest (method, path, payload) {
    return this.sendRequest(method, `/api/${path}`, payload)
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
    this.headers.Accept = `application/vnd.ark.core-api.v${this.version}+json`

    const client = axios.create({
      baseURL: this.host,
      headers: this.headers,
      timeout: this.timeout
    })

    return client[method](path, payload)
  }
}
