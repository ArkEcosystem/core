'use strict'

const logger = require('@phantomcore/core-container').resolvePlugin('logger')

const checkDNS = require('./utils/check-dns')
const checkNTP = require('./utils/check-ntp')
const Monitor = require('./monitor')
const startServer = require('./server')

module.exports = class PeerManager {
  /**
   * @constructor
   * @param  {Object} config
   */
  constructor (config) {
    this.config = config
    this.monitor = new Monitor(this)
  }

  /**
   * Start P2P interface.
   * @param {Boolean} networkStart
   */
  async start () {
    await this.__checkDNSConnectivity()
    await this.__checkNTPConnectivity()

    this.api = await startServer(this, this.config)

    await this.monitor.start(this.config.networkStart)

    return this
  }

  /**
   * Shutdown P2P interface.
   */
  async stop () {
    return this.api.stop()
  }

  /**
   * Update network status.
   * @return {Promise}
   */
  async updateNetworkStatus () {
    await this.monitor.updateNetworkStatus()
  }

  /**
   * Download blocks from a random peer.
   * @param  {Number}   fromBlockHeight
   * @return {Object[]}
   */
  downloadBlocks (fromBlockHeight) {
    return this.monitor.downloadBlocks(fromBlockHeight)
  }

  /**
   * Broadcast block to all peers.
   * @param {Block} block
   */
  async broadcastBlock (block) {
    await this.monitor.broadcastBlock(block)
  }

  /**
   * Broadcast transactions to peers.
   * @param {Transaction[]} transactions
   */
  broadcastTransactions (transactions) {
    return this.monitor.broadcastTransactions(transactions)
  }

  /**
   * Accept a new peer to the node.
   * @param  {Peer}    peer
   * @return {Promise}
   */
  acceptNewPeer (peer) {
    return this.monitor.acceptNewPeer(peer)
  }

  /**
   * ban an existing peer.
   * @param  {Peer}    peer
   * @return {Promise}
   */
  banPeer (ip) {
    return this.monitor.banPeer(ip)
  }

  /**
   * Get peers.
   * @return {Peer[]}
   */
  getPeers () {
    return this.monitor.getPeers()
  }

  /**
   * Get the peer for the given IP address.
   * @return {Peer}
   */
  getPeer (ip) {
    return this.monitor.getPeer(ip)
  }

  /**
   * Get a random peer.
   * @return {Peer}
   */
  getRandomPeer () {
    return this.monitor.getRandomPeer()
  }

  /**
   * Get a list of all suspended peers.
   * @return {Object}
   */
  getSuspendedPeers () {
    return this.monitor.getSuspendedPeers()
  }

  /**
   * Get the peer monitor.
   * @return {Object}
   */
  getMonitor () {
    return this.monitor
  }

  /**
   * Get network height.
   * @return {Number}
   */
  getNetworkHeight () {
    return this.monitor.getNetworkHeight()
  }

  async getNetworkState () {
    return this.monitor.getNetworkState()
  }

  /**
   * Check if the node can connect to any DNS host.
   * @return {void}
   */
  async __checkDNSConnectivity () {
    try {
      const host = await checkDNS(this.config.dns)

      logger.info(`Your network connectivity has been verified by ${host}`)
    } catch (error) {
      logger.error(error.message)
    }
  }

  /**
   * Check if the node can connect to any NTP host.
   * @return {void}
   */
  async __checkNTPConnectivity () {
    try {
      const { host, time } = await checkNTP(this.config.ntp)

      logger.info(`Your NTP connectivity has been verified by ${host}`)

      logger.info('Local clock is off by ' + parseInt(time.t) + 'ms from NTP :alarm_clock:')
    } catch (error) {
      logger.error(error.message)
    }
  }
}
