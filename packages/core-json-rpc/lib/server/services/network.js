const axios = require('axios')
const { configManager } = require('@arkecosystem/crypto')
const isReachable = require('is-reachable')
const sample = require('lodash/sample')
const app = require('@arkecosystem/core-container')

const logger = app.resolvePlugin('logger')
const p2p = app.resolvePlugin('p2p')
const config = app.resolvePlugin('config')

class Network {
  constructor() {
    this.network = config.network

    this.__loadRemotePeers()

    configManager.setConfig(config.network)

    this.client = axios.create({
      headers: {
        Accept: 'application/vnd.ark.core-api.v2+json',
        'Content-Type': 'application/json',
      },
      timeout: 3000,
    })
  }

  setServer() {
    this.server = this.__getRandomPeer()
  }

  async sendRequest(url, params = {}) {
    if (!this.server) {
      this.setServer()
    }

    const peer = await this.__selectResponsivePeer(this.server)
    const uri = `http://${peer.ip}:${peer.port}/api/${url}`

    try {
      logger.info(`Sending request on "${this.network.name}" to "${uri}"`)

      const response = await this.client.get(uri, { params })

      return response.data
    } catch (error) {
      logger.error(error.message)
    }
  }

  async broadcast(transaction) {
    return this.client.post(
      `http://${this.server.ip}:${this.server.port}/api/transactions`,
      {
        transactions: [transaction],
      },
    )
  }

  async connect() {
    if (this.server) {
      // logger.info(`Server is already configured as "${this.server.ip}:${this.server.port}"`)
      return
    }

    this.setServer()

    try {
      const peerPort = app.resolveOptions('p2p').port
      const response = await axios.get(
        `http://${this.server.ip}:${peerPort}/config`,
      )

      const plugin = response.data.data.plugins['@arkecosystem/core-api']

      if (!plugin.enabled) {
        const index = this.peers.findIndex(peer => peer.ip === this.server.ip)
        this.peers.splice(index, 1)

        if (!this.peers.length) {
          this.__loadRemotePeers()
        }

        return this.connect()
      }

      this.server.port = plugin.port
    } catch (error) {
      return this.connect()
    }
  }

  __getRandomPeer() {
    this.__loadRemotePeers()

    return sample(this.peers)
  }

  __loadRemotePeers() {
    this.peers =
      this.network.name === 'testnet'
        ? [{ ip: '127.0.0.1', port: app.resolveOptions('api').port }]
        : p2p.getPeers()

    if (!this.peers.length) {
      logger.error('No peers found. Shutting down...')
      process.exit()
    }
  }

  async __selectResponsivePeer(peer) {
    const reachable = await isReachable(`${peer.ip}:${peer.port}`)

    if (!reachable) {
      logger.warn(`${peer} is unresponsive. Choosing new peer.`)

      return this.__selectResponsivePeer(this.__getRandomPeer())
    }

    return peer
  }
}

module.exports = new Network()
