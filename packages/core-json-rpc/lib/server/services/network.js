const axios = require('axios')
const { client } = require('@arkecosystem/crypto')
const isReachable = require('is-reachable')
const { sample, orderBy } = require('lodash')
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

  async getFromNode (url, params = {}, peer = null) {
    const nethash = this.network ? this.network.nethash : null

    if (!peer && !this.server) {
      this.setServer()
    }

    peer = await this.__selectResponsivePeer(peer || this.server)

    let uri
    if (!url.startsWith('http')) {
      uri = `http://${peer}${url}`
    }

    try {
      logger.info(`Sending request on "${this.network.name}" to "${uri}"`)

      return axios.get(uri, {
        params,
        headers: {
          nethash,
          version: '2.0.0',
          port: 1
        }
      })
      .catch(err => {
        if (err.message === 'Request failed with status code 404') {
          // We are trying on the wrong API version
          let peerParts = peer.split(':')
          let port = peerParts[peerParts.length - 1]
          switch (port) {
            case '4003':
              if (this.network.name === 'devnet') {
                peerParts[peerParts.length - 1] = '4002' // Set devnet port
              } else if (this.network.name === 'mainnet') {
                peerParts[peerParts.length - 1] = '4001' // Set mainnet port
              }
              break;
            case '4001':
            case '4002':
            default:
              peerParts[peerParts.length - 1] = '4003' // Set the public API port
          }
          peer = peerParts.join(':')
          uri = `http://${peer}${url}`
          logger.info(`Sending request on "${this.network.name}" to "${uri}"`)
          return axios.get(uri, {
            params,
            headers: {
              nethash,
              version: '2.0.0',
              port: 1
            }
          })
        }
      })
    } catch (error) {
      logger.error(error.message)
    }
  }

  async findAvailablePeers () {
    try {
      const response = await this.getFromNode('/peer/list')

      let { networkHeight, peers } = this.__filterPeers(response.data.peers)

      if (process.env.NODE_ENV === 'test') {
        peers = peers.slice(0, 10)
      }

      let responsivePeers = []
      for (let i = 0; i < peers.length; i++) {
        const response = await this.getFromNode('/peer/status', {}, peers[i])

        if (Math.abs(response.data.height - networkHeight) <= 10) {
          responsivePeers.push(peers[i])
        }
      }

      this.network.peers = responsivePeers
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

      await this.findAvailablePeers()

      try {
        const response = await this.getFromNode('/api/loader/autoconfigure')

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

  // TODO: adjust this to core-p2p
  __filterPeers (peers) {
    let filteredPeers = peers
      .filter(peer => peer.status === 'OK')
      .filter(peer => peer.ip !== '127.0.0.1')

    filteredPeers = orderBy(filteredPeers, ['height', 'delay'], ['desc', 'asc'])

    const networkHeight = filteredPeers[0].height

    return {
      networkHeight,
      peers: filteredPeers
        .filter(peer => Math.abs(peer.height - networkHeight) <= 10)
        .map(peer => (`${peer.ip}:${peer.port}`))
    }
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
