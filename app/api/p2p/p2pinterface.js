const Down = require('./down')
const Up = require('./up')
const logger = require('../../core/logger')
const dns = require('dns')
const Sntp = require('sntp')

const isOnline = () => new Promise((resolve, reject) => dns.lookupService('8.8.8.8', 53, (err, hostname, service) => resolve(!err)))

module.exports = class P2PInterface {
  constructor (config) {
    this.down = new Down(this, config)
    this.up = new Up(this, config)
  }

  async checkOnline () {
    const online = await isOnline()
    if (!online) logger.error('Seems the node cannot access to internet (tested google DNS)')
    else logger.info('Node is online, Google DNS is reachable')
    const time = await Sntp.time()
    logger.info('Local clock is off by ' + parseInt(time.t) + 'ms from NTP ⏰')
  }

  async warmup (networkStart) {
    await this.checkOnline()
    await this.down.start(networkStart)
    await this.up.start()
  }

  tearDown () {
    this.down.stop()
    this.up.stop()
  }

  updateNetworkStatus () {
    return this.down.updateNetworkStatus()
  }

  downloadBlocks (fromBlockHeight) {
    return this.down.downloadBlocks(fromBlockHeight)
  }

  broadcastBlock (block) {
    this.down.broadcastBlock(block)
  }

  broadcastTransactions (transactions) {
    this.down.broadcastTransactions(transactions)
  }

  acceptNewPeer (peer) {
    return this.down.acceptNewPeer(peer)
  }

  getPeers () {
    return this.down.getPeers()
  }

  getNetworkHeight () {
    return this.down.getNetworkHeight()
  }
}
