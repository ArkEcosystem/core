'use strict';

const logger = require('@arkecosystem/core-plugin-manager').get('logger')
const dns = require('dns')
const Sntp = require('sntp')

const Down = require('./down')
const Up = require('./up')

const isOnline = () => new Promise((resolve, reject) => dns.lookupService('8.8.8.8', 53, (err, hostname, service) => resolve(!err)))

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class P2PInterface {
  /**
   * [constructor description]
   * @param  {[type]} upConfig   [description]
   * @param  {[type]} downConfig [description]
   * @return {[type]}            [description]
   */
  constructor (upConfig, downConfig) {
    this.down = new Down(this, downConfig)
    this.up = new Up(this, upConfig)
  }

  /**
   * [checkOnline description]
   * @return {[type]} [description]
   */
  async checkOnline () {
    const online = await isOnline()

    online
      ? logger.info('Node is online, Google DNS is reachable')
      : logger.error('Seems the node cannot access to internet (tested google DNS)')

    const time = await Sntp.time()

    logger.info('Local clock is off by ' + parseInt(time.t) + 'ms from NTP ⏰')
  }

  /**
   * [warmup description]
   * @param  {[type]} networkStart [description]
   * @return {[type]}              [description]
   */
  async warmup (networkStart) {
    await this.checkOnline()
    await this.down.start(networkStart)
    await this.up.start()
  }

  /**
   * [tearDown description]
   * @return {[type]} [description]
   */
  tearDown () {
    this.down.stop()
    this.up.stop()
  }

  /**
   * [updateNetworkStatus description]
   * @return {[type]} [description]
   */
  updateNetworkStatus () {
    return this.down.updateNetworkStatus()
  }

  /**
   * [downloadBlocks description]
   * @param  {[type]} fromBlockHeight [description]
   * @return {[type]}                 [description]
   */
  downloadBlocks (fromBlockHeight) {
    return this.down.downloadBlocks(fromBlockHeight)
  }

  /**
   * [broadcastBlock description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  broadcastBlock (block) {
    this.down.broadcastBlock(block)
  }

  /**
   * [broadcastTransactions description]
   * @param  {[type]} transactions [description]
   * @return {[type]}              [description]
   */
  broadcastTransactions (transactions) {
    this.down.broadcastTransactions(transactions)
  }

  /**
   * [acceptNewPeer description]
   * @param  {[type]} peer [description]
   * @return {[type]}      [description]
   */
  acceptNewPeer (peer) {
    return this.down.acceptNewPeer(peer)
  }

  /**
   * [getPeers description]
   * @return {[type]} [description]
   */
  getPeers () {
    return this.down.getPeers()
  }

  /**
   * [getNetworkHeight description]
   * @return {[type]} [description]
   */
  getNetworkHeight () {
    return this.down.getNetworkHeight()
  }
}
