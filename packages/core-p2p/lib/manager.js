'use strict'

const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

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

    await this.monitor.start(this.config.networkStart)

    this.api = await startServer(this, this.config)
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
   * Get peers.
   * @return {Peer[]}
   */
  getPeers () {
    return this.monitor.getPeers()
  }

  getPeer (ip) {
    return this.monitor.getPeer(ip)
  }

  /**
   * Get network height.
   * @return {Number}
   */
  getNetworkHeight () {
    return this.monitor.getNetworkHeight()
  }

  /**
   * Check if the node can connect to any DNS host.
   * @return {void}
   */
  async __checkDNSConnectivity () {
    try {
      const host = await checkDNS(this.config.dns)

      logger.info(`Your network connectivity has been verified by ${host}`)
    } catch (err) {
      logger.error(err.message)
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
    } catch (err) {
      logger.error(err.message)
    }
  }
}
