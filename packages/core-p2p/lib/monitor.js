'use strict'

const prettyMs = require('pretty-ms')
const moment = require('moment')
const delay = require('delay')

const { slots } = require('@arkecosystem/crypto')

const container = require('@arkecosystem/core-container')
const config = container.resolvePlugin('config')
const logger = container.resolvePlugin('logger')
const emitter = container.resolvePlugin('event-emitter')

const Peer = require('./peer')
const isLocalhost = require('./utils/is-localhost')

module.exports = class Monitor {
  /**
   * @constructor
   * @param  {PeerManager} manager
   * @throws {Error} If no seed peers
   */
  constructor (manager) {
    this.manager = manager
    this.config = config
    this.peers = {}
    this.suspendedPeers = {}

    if (!this.config.peers.list) {
      logger.error('No seed peers defined in peers.json :interrobang:')

      process.exit(1)
    }

    this.config.peers.list
      .filter(peer => (peer.ip !== '127.0.0.1' || peer.port !== container.resolveOptions('p2p').port))
      .forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port)), this)
  }

  /**
   * Method to run on startup.
   * @param {Boolean} networkStart
   */
  async start (networkStart = false) {
    if (!networkStart) {
      await this.updateNetworkStatus()
    }
  }

  /**
   * Update network status (currently only peers are updated).
   * @return {Promise}
   */
  async updateNetworkStatus () {
    try {
      // TODO: for tests that involve peers we need to sync them
      if (process.env.ARK_ENV !== 'test') {
        await this.discoverPeers()
        await this.cleanPeers()
      }

      if (Object.keys(this.peers).length < this.config.peers.list.length - 1 && process.env.ARK_ENV !== 'test') {
        this.config.peers.list
          .forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port)), this)

        return this.updateNetworkStatus()
      }
    } catch (error) {
      logger.error(`Network Status: ${error.message}`)

      this.config.peers.list.forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port)), this)

      return this.updateNetworkStatus()
    }
  }

  /**
   * Clear peers which aren't responding.
   * @param {Boolean} fast
   */
  async cleanPeers (fast = false) {
    let keys = Object.keys(this.peers)
    let count = 0
    let unresponsivePeers = 0
    const pingDelay = fast ? 1500 : config.peers.globalTimeout
    const max = keys.length

    logger.info(`Checking ${max} peers :earth_africa:`)

    await Promise.all(keys.map(async (ip) => {
      try {
        await this.peers[ip].ping(pingDelay)
        logger.printTracker('Peers Discovery', ++count, max)
      } catch (error) {
        unresponsivePeers++

        const formattedDelay = prettyMs(pingDelay, { verbose: true })
        logger.debug(`Removed peer ${ip} because it didn't respond within ${formattedDelay}.`)
        emitter.emit('peer.removed', this.peers[ip])

        delete this.peers[ip]

        return null
      }
    }))

    logger.stopTracker('Peers Discovery', max, max)
    logger.info(`${max - unresponsivePeers} of ${max} peers on the network are responsive`)
    logger.info(`Median Network Height: ${this.getNetworkHeight()}`)
    logger.info(`Network PBFT status: ${this.getPBFTForgingStatus()}`)
  }

  /**
   * Accept and store a valid peer.
   * @param  {Peer} peer
   * @throws {Error} If invalid peer
   */
  async acceptNewPeer (peer) {
    if (this.peers[peer.ip] || this.__isSuspended(peer) || process.env.ARK_ENV === 'test') {
      return
    }

    if (peer.nethash !== this.config.network.nethash) {
      throw new Error('Request is made on the wrong network')
    }

    if (peer.ip === '::ffff:127.0.0.1' || peer.ip === '127.0.0.1') {
      return
    }

    const newPeer = new Peer(peer.ip, peer.port)

    try {
      await newPeer.ping(1500)

      this.peers[peer.ip] = newPeer
      logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port}`)

      emitter.emit('peer.added', newPeer)
    } catch (error) {
      logger.debug(`Could not accept new peer '${newPeer.ip}:${newPeer.port}' - ${error}`)

      this.suspendedPeers[peer.ip] = {
        peer: newPeer,
        until: moment().add(this.manager.config.suspendMinutes, 'minutes')
      }

      // we don't throw since we answer unreacheable peer
      // TODO: in next version, only accept to answer to sound peers that have properly registered
      // hence we will throw an error
    }
  }

  /**
   * Get all available peers.
   * @return {Peer[]}
   */
  getPeers () {
    return Object.values(this.peers)
  }

  /**
   * Get the peer available peers.
   * @param  {String} ip
   * @return {Peer}
   */
  getPeer (ip) {
    return this.peers[ip]
  }

  /**
   * Get a random, available peer.
   * @param  {(Number|undefined)} acceptableDelay
   * @return {Peer}
   */
  getRandomPeer (acceptableDelay) {
    let keys = Object.keys(this.peers)
    keys = keys.filter((key) => this.peers[key].ban < new Date().getTime())

    if (acceptableDelay) {
      keys = keys.filter((key) => this.peers[key].delay < acceptableDelay)
    }

    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.peers[random]

    if (!randomPeer) {
      // logger.error(this.peers)
      delete this.peers[random]

      // FIXME: this method doesn't exist
      // this.manager.checkOnline()

      return this.getRandomPeer()
    }

    return randomPeer
  }

  /**
   * Get a random, available peer which can be used for downloading blocks.
   * @return {Peer}
   */
  getRandomDownloadBlocksPeer (minHeight) {
    let keys = Object.keys(this.peers)
    keys = keys.filter(key => this.peers[key].ban < new Date().getTime())
    // keys = keys.filter(key => this.peers[key].state.height > minHeight)
    keys = keys.filter(key => this.peers[key].downloadSize !== 100)

    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.peers[random]

    if (!randomPeer) {
      delete this.peers[random]

      return this.getRandomPeer()
    }

    return randomPeer
  }

  /**
   * Populate list of available peers from random peers.
   * @return {Peer[]}
   */
  async discoverPeers () {
    try {
      const list = await this.getRandomPeer().getPeers()

      list.forEach(peer => {
        if (peer.status === 'OK' && !this.peers[peer.ip] && !isLocalhost(peer.ip)) {
          this.peers[peer.ip] = new Peer(peer.ip, peer.port)
        }
      })

      return this.peers
    } catch (error) {
      return this.discoverPeers()
    }
  }

  /**
   * Get the median network height.
   * @return {Number}
   */
  getNetworkHeight () {
    const median = Object.values(this.peers)
      .filter(peer => peer.state.height)
      .map(peer => peer.state.height)
      .sort()

    return median[~~(median.length / 2)]
  }

  /**
   * Get the PBFT Forging status.
   * @return {Number}
   */
  getPBFTForgingStatus () {
    const height = this.getNetworkHeight()
    const slot = slots.getSlotNumber()
    const heights = {}
    const syncedPeers = Object.values(this.peers).filter(peer => peer.state.currentSlot === slot)
    syncedPeers.forEach(p => p.state && (heights[p.state.height] = heights[p.state.height] ? heights[p.state.height] + 1 : 1))
    console.log(heights)
    const allowedToForge = syncedPeers.filter(peer => peer.state && peer.state.forgingAllowed && peer.state.height >= height).length

    return allowedToForge / syncedPeers.length
  }

  /**
   * Download blocks from a random peer.
   * @param  {Number}   fromBlockHeight
   * @return {Object[]}
   */
  async downloadBlocks (fromBlockHeight) {
    const randomPeer = this.getRandomDownloadBlocksPeer(fromBlockHeight)

    try {
      logger.info(`Downloading blocks from height ${fromBlockHeight.toLocaleString()} via ${randomPeer.ip}`)

      await randomPeer.ping()

      const blocks = await randomPeer.downloadBlocks(fromBlockHeight)
      blocks.forEach(block => (block.ip = randomPeer.ip))

      return blocks
    } catch (error) {
      logger.error(`Block download: ${error.message}`)

      return this.downloadBlocks(fromBlockHeight)
    }
  }

  /**
   * Broadcast block to all peers.
   * @param  {Block}   block
   * @return {Promise}
   */
  async broadcastBlock (block) {
    const blockchain = container.resolvePlugin('blockchain')

    if (!blockchain) {
      logger.info(`Skipping broadcast of block ${block.data.height.toLocaleString()} as blockchain is not ready`)
      return
    }

    let blockPing = blockchain.getBlockPing()
    let peers = Object.values(this.peers)

    if (blockPing && blockPing.block.id === block.data.id) {
      // wait a bit before broadcasting if a bit early
      const diff = blockPing.last - blockPing.first
      const maxHop = 4
      let proba = (maxHop - blockPing.count) / maxHop

      if (diff < 500 && proba > 0) {
        await delay(500 - diff)

        blockPing = blockchain.getBlockPing()

        // got aleady a new block, no broadcast
        if (blockPing.block.id !== block.data.id) {
          return
        }

        proba = (maxHop - blockPing.count) / maxHop
      }

      // TODO: to be put in config?
      peers = peers.filter(p => Math.random() < proba)
    }

    logger.info(`Broadcasting block ${block.data.height.toLocaleString()} to ${peers.length} peers`)

    await Promise.all(peers.map(peer => peer.postBlock(block.toBroadcastV1())))
  }

  /**
   * Placeholder method to broadcast transactions to peers.
   * @param {Transaction[]} transactions
   */
  async broadcastTransactions (transactions) {
    const peers = Object.values(this.peers)
    logger.debug(`Broadcasting ${transactions.length} transactions to ${peers.length} peers`)

    const transactionsV1 = []
    transactions.forEach(transaction => transactionsV1.push(transaction.toBroadcastV1()))

    return Promise.all(peers.map(peer => peer.postTransactions(transactionsV1)))
  }

  /**
   * Determine if peer is suspended or not.
   * @param  {Peer} peer
   * @return {Boolean}
   */
  __isSuspended (peer) {
    const suspededPeer = this.suspendedPeers[peer.ip]

    if (suspededPeer && moment().isBefore(suspededPeer.until)) {
      return true
    } else if (suspededPeer) {
      delete this.suspendedPeers[peer.ip]
    }

    return false
  }
}
