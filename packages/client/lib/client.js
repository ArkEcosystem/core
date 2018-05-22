const HttpClient = require('./http')
const resources = require('./resources')

module.exports = class ApiClient {
  /**
   * @constructor
   * @param {String} host
   */
  constructor (host) {
    this.setConnection(host)

    this.version = 1
  }

  /**
   * Create a HTTP connection to the API.
   * @param {String} host
   */
  setConnection (host) {
    this.http = new HttpClient(host, this.version)
  }

  /**
   * Get the HTTP connection to the API.
   * @return {Object}
   */
  getConnection () {
    return this.http
  }

  /**
   * Set the API Version.
   * @param {Number} version
   */
  setVersion (version) {
    this.version = version
    this.http.setVersion(version)

    return this
  }

  /**
   * Create an instance of a version specific resource.
   * @param  {String}   name
   * @return {Resource}
   */
  resource (name) {
    return new resources[`v${this.version}`][name](this.http)
  }
}
