'use strict'

const monitor = require('../../../../monitor')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const data = monitor.getPeers()
      .map(peer => peer.toBroadcastInfo())
      .sort((a, b) => a.delay - b.delay)

    return { data }
  }
}
