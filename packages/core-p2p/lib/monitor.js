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
const isMyself = require('./utils/is-myself')
const networkState = require('./utils/network-state')

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
    this.startForgers = moment().add(this.config.peers.coldStart || 30, 'seconds')

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
  async updateNetworkStatus (fast = false) {
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
  async cleanPeers (fast = false, tracker = true) {
    let keys = Object.keys(this.peers)
    let count = 0
    let unresponsivePeers = 0
    const pingDelay = fast ? 1500 : this.config.peers.globalTimeout
    const max = keys.length

    logger.info(`Checking ${max} peers :telescope:`)
    await Promise.all(keys.map(async (ip) => {
      try {
        await this.getPeer(ip).ping(pingDelay)

        if (tracker) {
          logger.printTracker('Peers Discovery', ++count, max)
        }
      } catch (error) {
        unresponsivePeers++

        const formattedDelay = prettyMs(pingDelay, { verbose: true })
        logger.debug(`Removed peer ${ip} because it didn't respond within ${formattedDelay}.`)
        emitter.emit('peer.removed', this.getPeer(ip))

        delete this.peers[ip]

        return null
      }
    }))

    if (tracker) {
      logger.stopTracker('Peers Discovery', max, max)
      logger.info(`${max - unresponsivePeers} of ${max} peers on the network are responsive`)
      logger.info(`Median Network Height: ${this.getNetworkHeight()}`)
      logger.info(`Network PBFT status: ${this.getPBFTForgingStatus()}`)
    }
  }

  /**
   * ban an existing peer.
   * @param  {Peer} peer
   * @return {Promise}
   */
  banPeer (ip) {
    // TODO make a couple of tests on peer to understand the issue with this peer and decide how long to ban it
    const peer = this.peers[ip]
    if (peer) {
      if (this.__isSuspended(peer)) {
        this.suspendedPeers[ip].until = moment(this.suspendedPeers[ip].until).add(1, 'day')
      } else {
         this.__suspendPeer(peer)
      }
      logger.debug(`banned peer ${ip} until ${this.suspendedPeers[ip].until}`)
    }
  }

  /**
   * Accept and store a valid peer.
   * @param  {Peer} peer
   * @throws {Error} If invalid peer
   */
  async acceptNewPeer (peer) {
    if (this.getPeer(peer.ip) || this.__isSuspended(peer) || process.env.ARK_ENV === 'test' || !isMyself(peer.ip)) {
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

      this.__suspendPeer(newPeer)

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
    keys = keys.filter((key) => {
        const peer = this.getPeer(key)
        if (peer.ban < new Date().getTime()) {
            return true
        }

        if (acceptableDelay && peer.delay < acceptableDelay) {
            return true
        }

        return false
    })

    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.getPeer(random)

    if (!randomPeer) {
      // logger.error(this.peers)

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
    keys = keys.filter(key => {
        const peer = this.getPeer(key)
        if (peer.ban < new Date().getTime()) {
            return true
        }

        // if (peer.state.height > minHeight) {
        //    return true
        // }

        if (peer.downloadSize !== 100) {
            return true
        }

        return false
    })

    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.getPeer(random)

    if (!randomPeer) {
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
        if (peer.status === 'OK' && !this.getPeer(peer.ip) && !isMyself(peer.ip)) {
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
    const median = this.getPeers()
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

    let allowedToForge = 0
    let syncedPeers = 0

    for (let peer of this.getPeers()) {
      if (peer.state) {
        if (peer.state.currentSlot === slot) {
          syncedPeers++

          if (peer.state.forgingAllowed && peer.state.height >= height) {
            allowedToForge++
          }
        }

        heights[peer.state.height] = heights[peer.state.height] ? heights[peer.state.height] + 1 : 1
      }
    }

    console.log(heights)
    return allowedToForge / syncedPeers
  }

  async getNetworkState () {
    if (!this.__isColdStartActive()) {
      await this.cleanPeers(true, false)
    }

    return networkState(this, container.resolvePlugin('blockchain').getLastBlock())
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
    let peers = this.getPeers()

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
    const peers = this.getPeers()
    logger.debug(`Broadcasting ${transactions.length} transactions to ${peers.length} peers`)

    const transactionsV1 = []
    transactions.forEach(transaction => transactionsV1.push(transaction.toBroadcastV1()))

    return Promise.all(peers.map(peer => peer.postTransactions(transactionsV1)))
  }

  /**
   * Get a list of all suspended peers.
   * @return {Object}
   */
  getSuspendedPeers () {
    return this.suspendedPeers;
  }

  /**
   * Determine if peer is suspended or not.
   * @param  {Peer} peer
   * @return {Boolean}
   */
  __isSuspended (peer) {
    const suspendedPeer = this.suspendedPeers[peer.ip]

    if (suspendedPeer && moment().isBefore(suspendedPeer.until)) {
      return true
    } else if (suspendedPeer) {
      delete this.suspendedPeers[peer.ip]
    }

    return false
  }

  /**
   * Suspends a peer unless whitelisted
   * @param {Peer} peer
   */
  __suspendPeer (peer) {
    if (this.config.peers.whiteList.includes(peer.ip)) {
      return
    }

    this.suspendedPeers[peer.ip] = {
      peer: peer,
      until: moment().add(1, 'hours')
    }
  }

  /**
   * Determines if coldstart is still active. We need this for the network to start, so we dont forge, while
   * not all peers are up, or the network is not active
   */
  __isColdStartActive () {
    return this.startForgers > moment()
  }
}
