const async = require('async')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')
const { Block } = require('@arkecosystem/crypto').models
const QueueInterface = require('./interface')

module.exports = class RebuildQueue extends QueueInterface {
  /**
   * Create an instance of the process queue.
   * @param  {Blockchain} blockchain
   * @return {void}
   */
  constructor(blockchain, event) {
    super(blockchain, event)

    this.queue = async.queue((block, cb) => {
      if (this.queue.paused) return cb()
      try {
        return blockchain.rebuildBlock(new Block(block), cb)
      } catch (error) {
        logger.error(
          `Failed to rebuild block in RebuildQueue: ${block.height.toLocaleString()}`,
        )
        return cb()
      }
    }, 1)

    this.drain()
  }
}
