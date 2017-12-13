const async = require('async')
const db = require('./db')
const arkjs = require('arkjs')

class TransactionPool {
  contructor (config) {
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
    block.transactions.forEach(tx => delete this.pool[tx.id])
  }

  rebuildBlockHeader (block) {
    
  }
}

module.exports = TransactionPool
