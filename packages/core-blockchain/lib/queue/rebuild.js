const async = require('async')
const { Block } = require('@arkecosystem/crypto').models
const QueueInterface = require('./interface')

module.exports = class RebuildQueue extends QueueInterface {
  /**
   * Create an instance of the process queue.
   * @param  {Blockchain} blockchain
   * @return {void}
   */
  constructor (blockchain, event) {
    super(blockchain, event)

    this.queue = async.queue(
      (block, cb) => this.queue.paused ? cb() : blockchain.rebuildBlock(new Block(block), cb), 1
    )

    this.drain()
  }
}
