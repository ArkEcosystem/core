'use strict'

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const blockchain = container.resolvePlugin('blockchain')

const utils = require('../utils')
const schema = require('../schemas/peers')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: async (request, h) => {
    const peers = await blockchain.p2p.getPeers()

    if (!peers) {
      return utils.respondWith('No peers found', true)
    }

    let retPeers = peers.sort(() => 0.5 - Math.random())
    retPeers = request.query.os ? peers.filter(peer => peer.os === request.query.os) : retPeers
    retPeers = request.query.status ? peers.filter(peer => peer.status === request.query.status) : retPeers
    retPeers = request.query.port ? peers.filter(peer => peer.port === request.query.port) : retPeers
    retPeers = request.query.version ? peers.filter(peer => peer.version === request.query.version) : retPeers
    retPeers = retPeers.slice(0, (request.query.limit || 100))

    retPeers = retPeers.sort((a, b) => a.delay - b.delay)

    if (request.query.orderBy) {
      let order = request.query.orderBy.split(':')
      if (['port', 'status', 'os', 'version'].includes(order[0])) {
        retPeers = order[1].toUpperCase() === 'ASC'
          ? retPeers.sort((a, b) => a[order[0]] - b[order[0]])
          : retPeers.sort((a, b) => a[order[0]] + b[order[0]])
      }
    }

    return utils.respondWith({
      peers: utils.toCollection(request, retPeers.map(peer => peer.toBroadcastInfo()), 'peer')
    })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getPeers
      }
    }
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
  handler: async (request, h) => {
    const peers = await blockchain.p2p.getPeers()

    if (!peers) {
      return utils.respondWith('No peers found', true)
    }

    const peer = peers.find(elem => { return elem.ip === request.query.ip && elem.port === +request.query.port })

    if (!peer) {
      return utils.respondWith(`Peer ${request.query.ip}:${request.query.port} not found`, true)
    }

    return utils.respondWith({ peer: utils.toResource(request, peer, 'peer') })
  },
  config: {
    plugins: {
      'hapi-ajv': {
        querySchema: schema.getPeer
      }
    }
  }
}

/**
 * @type {Object}
 */
exports.version = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler: (request, h) => {
    return utils.respondWith({ version: config.server.version })
  }
}
