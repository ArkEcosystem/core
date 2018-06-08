'use strict'

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

    if (!this.config.peers.list) {
      logger.error('No seed peers defined in peers.json')

      process.exit(1)
    }

    this.config.peers.list
      .filter(peer => (peer.ip !== '127.0.0.1' || peer.port !== this.config.server.port))
      .forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, config)), this)
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
          .forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)), this)

        return this.updateNetworkStatus()
      }
    } catch (error) {
      logger.error(error.stack)

      this.config.peers.list.forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)), this)

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
    let wrongpeers = 0
    const pingDelay = fast ? 1500 : config.peers.globalTimeout
    const max = keys.length

    logger.info(`Checking ${max} peers`)

    await Promise.all(keys.map(async (ip) => {
      try {
        await this.peers[ip].ping(pingDelay)
        logger.printTracker('Peers Discovery', ++count, max, null, null)
      } catch (error) {
        wrongpeers++

        logger.debug(`Removed peer ${ip} from peer list. Peer didn't respond to ping (peer/status) call with delay of ${pingDelay}`)
        emitter.emit('peer.removed', this.peers[ip])

        delete this.peers[ip]

        return null
      }
    }))

    logger.stopTracker('Peers Discovery', max, max)
    logger.info(`Found ${max - wrongpeers}/${max} responsive peers on the network`)
    logger.info(`Median Network Height: ${this.getNetworkHeight()}`)
    logger.info(`Network PBFT status: ${this.getPBFTForgingStatus()}`)
  }

  /**
   * Accept and store a valid peer.
   * @param  {Peer} peer
   * @throws {Error} If invalid peer
   */
  async acceptNewPeer (peer) {
    if (this.peers[peer.ip] || process.env.ARK_ENV === 'test') {
      return
    }

    if (peer.nethash !== this.config.network.nethash) {
      throw new Error('Request is made on the wrong network')
    }

    if (peer.ip === '::ffff:127.0.0.1' || peer.ip === '127.0.0.1') {
      throw new Error('Localhost peer not accepted')
    }

    const newPeer = new Peer(peer.ip, peer.port, this.config)

    try {
      await newPeer.ping(1500)

      this.peers[peer.ip] = newPeer
      logger.debug(`Accepted new peer ${newPeer.ip}:${newPeer.port}`)

      emitter.emit('peer.added', newPeer)
    } catch (error) {
      logger.debug(`Could not accept new peer '${newPeer.ip}:${newPeer.port}' - ${error}`)
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
  getRandomDownloadBlocksPeer () {
    let keys = Object.keys(this.peers)
    keys = keys.filter(key => this.peers[key].ban < new Date().getTime())
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
          this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)
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
    const syncedPeers = Object.values(this.peers).filter(peer => peer.state.currentSlot === slot)
    const okForging = syncedPeers.filter(peer => peer.state && peer.state.forgingAllowed && peer.state.height >= height).length
    const ratio = okForging / syncedPeers.length

    return ratio
  }

  /**
   * Download blocks from a random peer.
   * @param  {Number}   fromBlockHeight
   * @return {Object[]}
   */
  async downloadBlocks (fromBlockHeight) {
    const randomPeer = this.getRandomDownloadBlocksPeer()

    try {
      await randomPeer.ping()

      const blocks = await randomPeer.downloadBlocks(fromBlockHeight)
      blocks.forEach(block => (block.ip = randomPeer.ip))

      return blocks
    } catch (error) {
      logger.error(JSON.stringify(error))

      return this.downloadBlocks(fromBlockHeight)
    }
  }

  /**
   * Broadcast block to all peers.
   * @param  {Block}   block
   * @return {Promise}
   */
  async broadcastBlock (block) {
    const peers = Object.values(this.peers)

    logger.info(`Broadcasting block ${block.data.height} to ${peers.length} peers`)

    await Promise.all(peers.map((peer) => peer.postBlock(block.toBroadcastV1())))
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
}
