const async = require('async')
const { Block } = require('@arkecosystem/client').models
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
        console.log('Failed to process block in ProcessQueue')
      }
    }, 1)

    this.drain()
  }
}
