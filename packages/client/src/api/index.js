const HttpClient = require('./http')

module.exports = class ApiClient {
  /**
   * @constructor
   * @param  {[type]} host [description]
   * @return {[type]}      [description]
   */
  constructor (host) {
    this.setConnection(host)

    this.version = 1
  }

  /**
   * [setConnection description]
   * @param {[type]} host [description]
   */
  setConnection (host) {
    this.http = new HttpClient(host, this.version)
  }

  /**
   * [getConnection description]
   * @return {[type]} [description]
   */
  getConnection () {
    return this.http
  }

  /**
   * [setVersion description]
   * @param {[type]} version [description]
   */
  setVersion (version) {
    this.version = version
    this.http.setVersion(version)

    return this
  }

  /**
   * [resource description]
   * @param  {String} name [description]
   * @return {Resource}      [description]
   */
  resource (name) {
    return new (require(`./resources/v${this.version}/${name}`))(this.http)
  }
}
