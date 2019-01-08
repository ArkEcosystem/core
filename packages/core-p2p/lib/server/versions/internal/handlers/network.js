const monitor = require('../../../../monitor')

/**
 * @type {Object}
 */
exports.state = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    return {
      data: await monitor.getNetworkState(),
    }
  },
}
