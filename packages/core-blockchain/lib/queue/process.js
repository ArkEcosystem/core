const async = require('async')
const logger = require('@arkecosystem/core-container').resolvePlugin('logger')
const { Block } = require('@arkecosystem/crypto').models
const QueueInterface = require('./interface')

module.exports = class ProcessQueue extends QueueInterface {
  /**
   * Create an instance of the process queue.
   * @param  {Blockchain} blockchain
   * @return {void}
   */
  constructor (blockchain, event) {
    super(blockchain, event)

    this.queue = async.queue((block, cb) => {
      try {
        return blockchain.processBlock(new Block(block), cb)
      } catch (error) {
        logger.error(`Failed to process block in ProcessQueue: ${block.height.toLocaleString()}`)
        logger.error(error)
        return cb()
      }
    }, 1)

    this.drain()
  }
}
