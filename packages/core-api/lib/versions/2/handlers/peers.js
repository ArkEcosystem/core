'use strict'

const Boom = require('boom')
const blockchain = require('@arkecosystem/core-container').resolvePlugin('blockchain')
const utils = require('../utils')
const schema = require('../schema/peers')

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
    const allPeers = await blockchain.p2p.getPeers()

    let result = allPeers.sort((a, b) => a.delay - b.delay)
    result = request.query.os ? result.filter(peer => peer.os === request.query.os) : result
    result = request.query.status ? result.filter(peer => peer.status === request.query.status) : result
    result = request.query.port ? result.filter(peer => peer.port === request.query.port) : result
    result = request.query.version ? result.filter(peer => peer.version === request.query.version) : result
    result = result.slice(0, (request.query.limit || 100))

    if (request.query.orderBy) {
      const order = request.query.orderBy.split(':')

      if (['port', 'status', 'os', 'version'].includes(order[0])) {
        result = order[1].toUpperCase() === 'ASC'
          ? result.sort((a, b) => a[order[0]] - b[order[0]])
          : result.sort((a, b) => a[order[0]] + b[order[0]])
      }
    }

    return utils.toPagination(request, { rows: result, count: result.length }, 'peer')
  },
  options: {
    validate: schema.index
  }
}

/**
 * @type {Object}
 */
exports.show = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const peers = await blockchain.p2p.getPeers()
    const peer = peers.find(p => p.ip === request.params.ip)

    if (!peer) {
      return Boom.notFound('Peer not found')
    }

    return utils.respondWithResource(request, peer, 'peer')
  },
  options: {
    validate: schema.show
  }
}

/**
 * @type {Object}
 */
exports.suspended = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const peers = blockchain.p2p.getSuspendedPeers()

    return utils.respondWithCollection(request, Object.values(peers).map(peer => peer.peer), 'peer')
  }
}
