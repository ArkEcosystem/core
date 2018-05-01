'use strict'

const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const Sntp = require('sntp')

const checkDNS = require('./utils/check-dns')
const checkNTP = require('./utils/check-ntp')
const Down = require('./down')
const Up = require('./up')

module.exports = class P2PInterface {
  /**
   * @constructor
   * @param  {Object} upConfig
   * @param  {Object} downConfig
   */
  constructor (upConfig, downConfig) {
    this.down = new Down(this, downConfig)
    this.up = new Up(this, upConfig)
  }

  /**
   * Start P2P interface.
   * @param {Boolean} networkStart
   */
  async warmup (networkStart) {
    await this.__checkDNSConnectivity()
    await this.__checkNTPConnectivity()

    await this.down.start(networkStart)
    await this.up.start()
  }

  /**
   * Shutdown P2P interface.
   */
  tearDown () {
    this.down.stop()
    this.up.stop()
  }

  /**
   * Update network status.
   * @return {Promise}
   */
  updateNetworkStatus () {
    return this.down.updateNetworkStatus()
  }

  /**
   * Download blocks from a random peer.
   * @param  {Number}   fromBlockHeight
   * @return {Object[]}
   */
  downloadBlocks (fromBlockHeight) {
    return this.down.downloadBlocks(fromBlockHeight)
  }

  /**
   * Broadcast block to all peers.
   * @param {Block} block
   */
  broadcastBlock (block) {
    this.down.broadcastBlock(block)
  }

  /**
   * Broadcast transactions to peers.
   * @param {Transaction[]} transactions
   */
  broadcastTransactions (transactions) {
    this.down.broadcastTransactions(transactions)
  }

  /**
   * Accept a new peer to the node.
   * @param  {Peer}    peer
   * @return {Promise}
   */
  acceptNewPeer (peer) {
    return this.down.acceptNewPeer(peer)
  }

  /**
   * Get peers.
   * @return {Peer[]}
   */
  getPeers () {
    return this.down.getPeers()
  }

  /**
   * Get network height.
   * @return {Number}
   */
  getNetworkHeight () {
    return this.down.getNetworkHeight()
  }

  /**
   * Check if the node can connect to any DNS host.
   */
  async __checkDNSConnectivity () {
    try {
      const host = await checkDNS(this.up.config.dns)

      logger.info(`Your network connectivity has been verified by ${host}`)
    } catch (err) {
      logger.error(err.message)
    }
  }

  /**
   * Check if the node can connect to any NTP host.
   */
  async __checkNTPConnectivity () {
    try {
      const { host, time } = await checkNTP(this.up.config.ntp)

      logger.info(`Your NTP connectivity has been verified by ${host}`)

      logger.info('Local clock is off by ' + parseInt(time.t) + 'ms from NTP :alarm_clock:')
    } catch (err) {
      logger.error(err.message)
    }
  }
}
