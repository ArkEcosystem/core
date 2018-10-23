const axios = require('axios')
const { client } = require('@arkecosystem/crypto')
const isReachable = require('is-reachable')
const { sample } = require('lodash')
const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')
const p2p = container.resolvePlugin('p2p')
const config = container.resolvePlugin('config')

class Network {
  setNetwork () {
    this.network = config.network

    this.__loadRemotePeers()

    client.setConfig(config.network)

    return this.network
  }

  setServer () {
    this.server = this.__getRandomPeer()

    return this.server
  }

  async getFromNodeApi (url, params = {}, peer = null) {
    return this.getFromNode(url, params, peer, true)
  }

  async getFromNode (url, params = {}, peer = null, apiEndpoint = false) {
    const nethash = this.network ? this.network.nethash : null

    if (!peer && !this.server) {
      this.setServer()
    }

    peer = await this.__selectResponsivePeer(peer || this.server)
    const peerIPandPort = peer.split(':')

    const uri = `http://${peerIPandPort[0]}:${apiEndpoint ? 4003 : peerIPandPort[1]}${url}`

    try {
      logger.info(`Sending request on "${this.network.name}" to "${uri}"`)

      return await axios.get(uri, {
        params,
        headers: {
          nethash,
          version: '2.0.0',
          port: 1
        }
      })
    } catch (error) {
      logger.error(error.message)
    }
  }

  async postTransaction (transaction, peer) {
    const server = peer || this.server

    return axios.post(`http://${server}/peer/transactions`, {
      transactions: [transaction]
    }, {
      headers: {
        nethash: this.network.nethash,
        version: '0.1.0',
        port: 1
      }
    })
  }

  async broadcast (transaction) {
    const peers = this.network.peers.slice(0, 10)

    for (let i = 0; i < peers.length; i++) {
      logger.info(`Broadcasting to ${peers[i]}`)

      await this.postTransaction(transaction, peers[i])
    }
  }

  async connect () {
    if (this.server) {
      logger.info(`Server is already configured as "${this.server}"`)
    }

    if (this.network) {
      logger.info(`Network is already configured as "${this.network.name}"`)
    }

    if (!this.server || !this.network) {
      this.setNetwork()
      this.setServer()

      try {
        const response = await this.getFromNodeApi('/api/loader/autoconfigure')

        this.network.config = response.data.network
      } catch (error) {
        return this.connect()
      }
    }
  }

  __getRandomPeer () {
    this.__loadRemotePeers()

    return sample(this.network.peers)
  }

  __loadRemotePeers () {
    const response = p2p.getPeers()

    this.network.peers = response.map(peer => `${peer.ip}:${peer.port}`)
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
