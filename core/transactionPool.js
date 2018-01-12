const async = require('async')
const arkjs = require('arkjs')

class TransactionPool {
  constructor (config) {
    this.config = config

    const that = this

    this.pool = {}
    this.queue = async.queue((transaction, qcallback) => {
      that.verify(transaction)
      qcallback()
    }, this.config.server.multicore.transactionpool || 1)
  }

  addTransaction (transaction) {
    this.queue.push(transaction)
    return Promise.resolve()
  }

  verify (transaction) {
    return arkjs.crypto.verify(transaction)
  }

  addBlock (block) {
    return Promise.all(block.transactions.map(tx => delete this.pool[tx.id]))
  }

  undoBlock (block) {
    return Promise.all(block.transactions.map(tx => this.addTransaction(tx)))
  }

  // rebuildBlockHeader (block) {

  // }
}

module.exports = TransactionPool
