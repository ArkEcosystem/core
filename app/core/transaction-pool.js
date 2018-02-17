const async = require('async')
const arkjs = require('arkjs')
const config = require('app/core/config')
const goofy = require('app/core/goofy')
const Transaction = require('app/models/transaction')
const WalletManager = require('app/core/managers/wallet')

let instance = null

module.exports = async (message, done) => {
  if (message.event === 'init') {
    const conf = await config.init(message.data)
    goofy.init(null, conf.server.fileLogLevel, conf.network.name + '_transactionPool')
    instance = new TransactionPool()
    return done()
  }

  if (instance && instance[message.event]) { // redirect to public methods
    return done(instance[message.event](message.data))
  }

  throw new Error(`message '${message.event}' not recognised`)
}

class TransactionPool {
  constructor () {
    const that = this
    this.walletManager = new WalletManager()
    this.pool = {}
    // this.transactionsByWallet = {} // "<Address>": [tx1, tx2, ..., txn]
    // idea is to cherrypick the related transaction in the pool to be undoed should a new block being added:
    // - grab all the transactions from the block
    // - grab all sender wallets from those transactions
    // - grap all tx in the pool from those wallets from this.transactionsByWallet
    // - undo those tx
    // - apply block txs
    // - reinject remaining txs to the pool
    this.queue = async.queue((transaction, qcallback) => {
      that.verify(transaction)
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
      instance.walletManager.updateWallet(acc)
    })
    goofy.debug(`transactions pool started with ${instance.walletManager.getLocalWallets().length} wallets`)
  }

  async addTransaction (transaction) {
    this.queue.push(new Transaction(transaction))
  }

  async addTransactions (transactions) {
    this.queue.push(transactions.map(tx => new Transaction(tx)))
  }

  verify (transaction) {
    // this throws an "undefined method canApply" because it is defined in "models/wallet" and not instance.walletManager
    if (arkjs.crypto.verify(transaction) && instance.walletManager.canApply(transaction)) {
      this.walletManager.applyTransaction(transaction)
      return true
    }
  }

  async addBlock (block) { // we remove the block txs from the pool
    await this.walletManager.applyBlock(block)
    goofy.debug(`removing ${block.transactions.length} transactions from transactionPool`)
    const pooltxs = Object.values(this.pool)
    this.pool = {}
    const blocktxsid = block.transactions.map(tx => tx.data.id)

    // no return the main thread is liberated
    pooltxs.forEach(tx => tx.id in blocktxsid ? delete this.pool[tx.id] : null)

    this.addTransactions(pooltxs)
  }

  async undoBlock (block) { // we add back the block txs to the pool
    if (block.transactions.length === 0) return
    // no return the main thread is liberated
    this.addTransactions(block.transactions.map(tx => tx.data))
  }

  // rebuildBlockHeader (block) {

  // }
}

// module.exports = instance
