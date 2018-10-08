'use strict'

const container = require('@arkecosystem/core-container')
const p2p = container.resolvePlugin('p2p')

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
  async handler (request, h) {
    const allPeers = await p2p.getPeers()

    if (!allPeers) {
      return utils.respondWith('No peers found', true)
    }

    let peers = allPeers.map(peer => {
        // just use 'OK' status for API instead of p2p http status codes
        peer.status = peer.status === 200 ? 'OK' : peer.status
        return peer
      })
      .sort((a, b) => a.delay - b.delay)
    peers = request.query.os ? allPeers.filter(peer => peer.os === request.query.os) : peers
    peers = request.query.status ? allPeers.filter(peer => peer.status === request.query.status) : peers
    peers = request.query.port ? allPeers.filter(peer => peer.port === request.query.port) : peers
    peers = request.query.version ? allPeers.filter(peer => peer.version === request.query.version) : peers
    peers = peers.slice(0, (request.query.limit || 100))

    if (request.query.orderBy) {
      const order = request.query.orderBy.split(':')
      if (['port', 'status', 'os', 'version'].includes(order[0])) {
        peers = order[1].toUpperCase() === 'ASC'
          ? peers.sort((a, b) => a[order[0]] - b[order[0]])
          : peers.sort((a, b) => a[order[0]] + b[order[0]])
      }
    }

    return utils.respondWith({
      peers: utils.toCollection(request, peers.map(peer => peer.toBroadcastInfo()), 'peer')
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
  async handler (request, h) {
    const peers = await p2p.getPeers()

    if (!peers) {
      return utils.respondWith('No peers found', true)
    }

    const peer = peers.find(elem => {
      return elem.ip === request.query.ip && +elem.port === +request.query.port
    })

    if (!peer) {
      return utils.respondWith(`Peer ${request.query.ip}:${request.query.port} not found`, true)
    }

    return utils.respondWith({ peer: utils.toResource(request, peer.toBroadcastInfo(), 'peer') })
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
  handler (request, h) {
    return utils.respondWith({
      version: container.resolveOptions('blockchain').version
    })
  }
}
