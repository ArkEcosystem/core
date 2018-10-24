const axios = require('axios')
const { configManager } = require('@arkecosystem/crypto')
const isReachable = require('is-reachable')
const sample = require('lodash/sample')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const p2p = container.resolvePlugin('p2p')
const config = container.resolvePlugin('config')

class Network {
  constructor () {
    this.network = config.network

    this.__loadRemotePeers()

    configManager.setConfig(config.network)

    this.client = axios.create({
      headers: { Accept: 'application/vnd.ark.core-api.v2+json' },
      timeout: 3000
    })
  }

  setServer () {
    this.server = this.__getRandomPeer()
  }

  async sendRequest (url, params = {}, peer = null) {
    if (!peer && !this.server) {
      this.setServer()
    }

    peer = await this.__selectResponsivePeer(peer || this.server)
    const peerIPandPort = peer.split(':')

    const uri = `http://${peerIPandPort[0]}:4003/api/${url}`

    try {
      logger.info(`Sending request on "${this.network.name}" to "${uri}"`)

      const response = await this.client.get(uri, { params })

      return response.data
    } catch (error) {
      logger.error(error.message)
    }
  }

  async postTransaction (transaction, peer) {
    const server = peer || this.server

    return this.client.post(`http://${server}/api/transactions`, {
      transactions: [transaction]
    })
  }

  async broadcast (transaction) {
    const peers = this.network.peers.slice(0, 10)

    for (const peer of peers) {
      logger.info(`Broadcasting to ${peer}`)

      await this.postTransaction(transaction, peer)
    }
  }

  async connect () {
    if (this.server) {
      logger.info(`Server is already configured as "${this.server}"`)
      return
    }

    this.setServer()

    try {
      await this.sendRequest('node/configuration')
    } catch (error) {
      return this.connect()
    }
  }

  __getRandomPeer () {
    this.__loadRemotePeers()

    return sample(this.network.peers)
  }

  __loadRemotePeers () {
    this.network.peers = this.network.name === 'testnet'
      ? ['127.0.0.1:4003']
      : p2p.getPeers().map(peer => `${peer.ip}:${peer.port}`)
  }

  async __selectResponsivePeer (peer) {
    const reachable = await isReachable(peer)

    if (!reachable) {
      logger.warn(`${peer} is unresponsive. Choosing new peer.`)

      return this.__selectResponsivePeer(this.__getRandomPeer())
    }

    return peer
  }
}

module.exports = new Network()
