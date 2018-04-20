'use strict';

const { slots } = require('@arkecosystem/client')

const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')

const Peer = require('./peer')
const isLocalhost = require('./utils/is-localhost')

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class Down {
  /**
   * [constructor description]
   * @param  {[type]} p2p    [description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  constructor (p2p, config) {
    this.p2p = p2p
    this.config = config
    this.peers = {}
    if (!config.server.peers.list) throw new Error('No seed peers defined in config/server.json')
    config.server.peers.list
      .filter(peer => (peer.ip !== '127.0.0.1' || peer.port !== this.config.server.port))
      .forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, config)), this)
  }

  /**
   * [start description]
   * @param  {Boolean} networkStart [description]
   * @return {[type]}               [description]
   */
  async start (networkStart = false) {
    if (!networkStart) {
      await this.updateNetworkStatus()
    }
  }

  /**
   * [updateNetworkStatus description]
   * @return {[type]} [description]
   */
  async updateNetworkStatus () {
    try {
      if (process.env.ARK_ENV !== 'test') {
        await this.discoverPeers()
        await this.cleanPeers()
      }

      if (Object.keys(this.peers).length < this.config.server.peers.list.length - 1 && process.env.ARK_ENV !== 'test') {
        this.config.server.peers.list
          .forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)), this)

        return this.updateNetworkStatus()
      }
    } catch (error) {
      logger.error(error.stack)

      this.config.server.peers.list.forEach(peer => (this.peers[peer.ip] = new Peer(peer.ip, peer.port, this.config)), this)

      return this.updateNetworkStatus()
    }
  }

  /**
   * [stop description]
   * @return {[type]} [description]
   */
  stop () {
    // Noop
  }

  /**
   * [cleanPeers description]
   * @param  {Boolean} fast [description]
   * @return {[type]}       [description]
   */
  async cleanPeers (fast = false) {
    let keys = Object.keys(this.peers)
    let count = 0
    const max = keys.length
    let wrongpeers = 0

    logger.info(`Checking ${max} peers`)

    await Promise.all(keys.map(async (ip) => {
      try {
        await this.peers[ip].ping(fast ? 1000 : 5000)
        logger.printTracker('Peers Discovery', ++count, max, null, null)
      } catch (error) {
        wrongpeers++
        delete this.peers[ip]

        pluginManager.get('webhooks').emit('peer.removed', this.peers[ip])

        return null
      }
    }))

    logger.stopTracker('Peers Discovery', max, max)
    logger.info(`Found ${max - wrongpeers}/${max} responsive peers on the network`)
    logger.info(`Median Network Height: ${this.getNetworkHeight()}`)
    logger.info(`Network PBFT status: ${this.getPBFTForgingStatus()}`)
  }

  /**
   * [acceptNewPeer description]
   * @param  {[type]} peer [description]
   * @return {[type]}      [description]
   */
  async acceptNewPeer (peer) {
    if (this.peers[peer.ip] || process.env.ARK_ENV === 'test') return
    if (peer.nethash !== this.config.network.nethash) throw new Error('Request is made on the wrong network')
    if (peer.ip === '::ffff:127.0.0.1' || peer.ip === '127.0.0.1') throw new Error('Localhost peer not accepted')

    const npeer = new Peer(peer.ip, peer.port, this.config)

    try {
      await npeer.ping()
      this.peers[peer.ip] = npeer

      pluginManager.get('webhooks').emit('peer.added', npeer)
    } catch (error) {
      logger.debug(`Peer ${npeer} not connectable - ${error}`)
    }
  }

  /**
   * [getPeers description]
   * @return {[type]} [description]
   */
  async getPeers () {
    return Object.values(this.peers)
  }

  /**
   * [getRandomPeer description]
   * @param  {[type]} delay [description]
   * @return {[type]}       [description]
   */
  getRandomPeer (delay) {
    let keys = Object.keys(this.peers)
    keys = keys.filter((key) => this.peers[key].ban < new Date().getTime())
    if (delay) keys = keys.filter((key) => this.peers[key].delay < delay)
    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.peers[random]
    if (!randomPeer) {
      // logger.error(this.peers)
      delete this.peers[random]
      this.p2p.checkOnline()
      return this.getRandomPeer()
    }
    return randomPeer
  }

  /**
   * [getRandomDownloadBlocksPeer description]
   * @return {[type]} [description]
   */
  getRandomDownloadBlocksPeer () {
    let keys = Object.keys(this.peers)
    keys = keys.filter(key => this.peers[key].ban < new Date().getTime())
    keys = keys.filter(key => this.peers[key].downloadSize !== 100)
    const random = keys[keys.length * Math.random() << 0]
    const randomPeer = this.peers[random]
    if (!randomPeer) {
      // logger.error(this.peers)
      delete this.peers[random]
      return this.getRandomPeer()
    }
    return randomPeer
  }

  /**
   * [discoverPeers description]
   * @return {[type]} [description]
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
   * [later description]
   * @param  {[type]} delay [description]
   * @param  {[type]} value [description]
   * @return {[type]}       [description]
   */
  later (delay, value) {
    return new Promise(resolve => setTimeout(resolve, delay, value))
  }

  /**
   * [getNetworkHeight description]
   * @return {[type]} [description]
   */
  getNetworkHeight () {
    const median = Object.values(this.peers)
      .filter(peer => peer.state.height)
      .map(peer => peer.state.height)
      .sort()
    return median[~~(median.length / 2)]
  }

  /**
   * [getPBFTForgingStatus description]
   * @return {[type]} [description]
   */
  getPBFTForgingStatus () {
    const height = this.getNetworkHeight()
    const slot = slots.getSlotNumber()
    const syncedPeers = Object.values(this.peers).filter(peer => peer.state.currentSlot === slot)
    const okForging = syncedPeers.filter(peer => peer.state.forgingAllowed && peer.state.height >= height).length
    const ratio = okForging / syncedPeers.length
    return ratio
  }

  /**
   * [downloadBlocks description]
   * @param  {[type]} fromBlockHeight [description]
   * @return {[type]}                 [description]
   */
  async downloadBlocks (fromBlockHeight) {
    const randomPeer = this.getRandomDownloadBlocksPeer()

    try {
      await randomPeer.ping()

      return randomPeer.downloadBlocks(fromBlockHeight)
    } catch (error) {
      return this.downloadBlocks(fromBlockHeight)
    }
  }

  /**
   * [broadcastBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  broadcastBlock (block) {
    const bpeers = Object.values(this.peers)
    // console.log(Object.values(this.peers))
    logger.info(`Broadcasting block ${block.data.height} to ${bpeers.length} peers`)
    return Promise.all(bpeers.map((peer) => peer.postBlock(block.toBroadcastV1())))
  }

  /**
   * [broadcastTransactions description]
   * @param  {[type]} transactions [description]
   * @return {[type]}              [description]
   */
  broadcastTransactions (transactions) {

  }
}
