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
      (block, cb) => {
        if (this.queue.paused) return cb()
        try {
          return blockchain.rebuildBlock(new Block(block), cb)
        } catch (error) {
          console.log(error)
          console.log(block)
          return cb()
        }
      }, 1
    )

    this.drain()
  }
}
