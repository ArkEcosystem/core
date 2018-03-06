const async = require('async')
const arkjs = require('arkjs')
const config = require('app/core/config')
const logger = require('app/core/logger')
const Transaction = require('app/models/transaction')
const WalletManager = require('app/core/managers/wallet')
const MemoryPool = require('app/core/memory-pool')

let instance = null

module.exports = async (message, done) => {
  if (message.event === 'init') {
    const conf = await config.init(message.data)
    logger.init(conf.server.logging, conf.network.name + '_transactionQueue')
    instance = new TransactionQueue(conf)
    logger.info('Init transaction queue')
    return done()
  }

  if (instance && instance[message.event]) { // redirect to public methods
    return done(instance[message.event](message.data))
  }

  throw new Error(`message '${message.event}' not recognised`)
}

class TransactionQueue {
  constructor (config) {
    const that = this
    this.walletManager = new WalletManager()
    this.pool = new MemoryPool(Transaction, config, true)
    // this.transactionsByWallet = {} // "<Address>": [tx1, tx2, ..., txn]
    // idea is to cherrypick the related transaction in the pool to be undoed should a new block being added:
    // - grab all the transactions from the block
    // - grab all sender wallets from those transactions
    // - grap all tx in the pool from those wallets from this.transactionsByWallet
    // - undo those tx
    // - apply block txs
    // - reinject remaining txs to the pool
    this.queue = async.queue((transaction, qcallback) => {
      if (that.verify(transaction)) {
        this.pool.add(transaction)
      }
      qcallback()
    }, 1)
  }

  // duplication of the walletManager from blockchainManager to apply/validate transactions before storing them into pool
  async start (wallets) {
    instance.walletManager.reset()
    wallets.forEach(wallet => {
      const acc = instance.walletManager.getWalletByAddress(wallet.address)
      for (let key in Object(wallet)) {
        acc[key] = wallet[key]
      }
      instance.walletManager.reindex(acc)
    })
    logger.debug(`transactions pool started with ${instance.walletManager.getLocalWallets().length} wallets`)
  }

  async addTransaction (transaction) {
    this.queue.push(new Transaction(transaction))
  }

  async addTransactions (transactions) {
    this.queue.push(transactions.map(tx => new Transaction(tx)))
  }

  verify (transaction) {
    const wallet = this.walletManager.getWalletByPublicKey(transaction.senderPublicKey)
    if (arkjs.crypto.verify(transaction) && wallet.canApply(transaction)) {
      this.walletManager.applyTransaction(transaction)
      return true
    }
  }

  async addBlock (block) { // we remove the block txs from the pool
    await this.walletManager.applyBlock(block)
    await this.pool.removeForgedTransactions(block.transactions)
    this.pool.cleanPool(block.data.height)
  }

  async undoBlock (block) { // we add back the block txs to the pool
    if (block.transactions.length === 0) return
    // no return the main thread is liberated
    this.addTransactions(block.transactions.map(tx => tx.data))
  }

  async getTransactions (blockSize) {
    let retItems = await this.pool.getItems(blockSize)
    console.log(retItems)
    return {
      transactions: retItems,
      poolSize: this.pool.size,
      count: retItems.length
    }
  }

  // rebuildBlockHeader (block) {

  // }
}

// module.exports = instance
