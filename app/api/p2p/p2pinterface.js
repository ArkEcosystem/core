const Down = require('./down')
const Up = require('./up')

module.exports = class P2PInterface {
  constructor (config) {
    this.down = new Down(config)
    this.up = new Up(config)
  }

  warmup () {
    return Promise.all([
      this.down.start(this),
      this.up.start(this)
    ])
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
