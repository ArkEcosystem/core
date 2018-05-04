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

    this.queue = async.queue((block, cb) => blockchain.processBlock(new Block(block), cb), 1)

    this.drain()
  }
}
