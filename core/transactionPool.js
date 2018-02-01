const async = require('async')
const arkjs = require('arkjs')
const registerPromiseWorker = require(`${__dirname}/core/promise-worker/register`)
const config = require(`${__dirname}/core/config`)
const goofy = require(`${__dirname}/core/goofy`)
const Transaction = require(`${__dirname}/model/Transaction`)
const WalletManager = require(`${__dirname}/core/walletManager`)

let instance = null

registerPromiseWorker(message => {
  if (message.event === 'init') {
    return config.init(message.data)
      .then((conf) => goofy.init(null, conf.server.fileLogLevel, conf.network.name + '_transactionPool'))
      .then(() => (instance = new TransactionPool()))
  }
  if (instance && instance[message.event]) { // redirect to public methods
    return instance[message.event](message.data)
  } else return Promise.reject(new Error(`message '${message}' not recognised`))
})

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
  start (wallets) {
    instance.walletManager.reset()
    wallets.forEach(wallet => {
      const acc = instance.walletManager.getWalletByAddress(wallet.address)
      for (let key in Object(wallet)) {
        acc[key] = wallet[key]
      }
      instance.walletManager.updateWallet(acc)
    })
    goofy.debug(`transactions pool started with ${instance.walletManager.getLocalWallets().length} wallets`)
    return Promise.resolve()
  }

  addTransaction (transaction) {
    this.queue.push(new Transaction(transaction))
    return Promise.resolve()
  }

  addTransactions (transactions) {
    this.queue.push(transactions.map(tx => new Transaction(tx)))
    return Promise.resolve()
  }

  verify (transaction) {
    if (arkjs.crypto.verify(transaction) && this.walletManager.canApply(transaction)) {
      this.walletManager.applyTransaction(transaction)
      return true
    }
  }

  addBlock (block) { // we remove the block txs from the pool
    if (block.transactions.length === 0) return Promise.resolve()
    logger.debug(`removing ${block.transactions.length} transactions from transactionPool`)
    const pooltxs = Object.values(this.pool)
    this.pool = {}
    const blocktxsid = block.transactions.map(tx => tx.data.id)
    return Promise
      .all(pooltxs.map((index, tx) => {
        if (tx.id in blocktxsid) delete pooltxs[index]
        return this.walletManager.undoTransaction(tx)
      }))
      .then(() => Promise.all(block.transactions.map(tx => this.walletManager.applyTransaction(tx))))
      .then(() => this.addTransactions(pooltxs))
  }

  undoBlock (block) { // we add back the block txs to the pool
    if (block.transactions.length === 0) return Promise.resolve()
    return this.addTransactions(block.transactions.map(tx => tx.data))
  }

  // rebuildBlockHeader (block) {

  // }
}

// module.exports = instance
