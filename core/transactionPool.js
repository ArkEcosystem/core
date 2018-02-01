const async = require('async')
const arkjs = require('arkjs')
const registerPromiseWorker = require(`${__dirname}/core/promise-worker/register`)
const config = require(`${__dirname}/core/config`)
const goofy = require(`${__dirname}/core/goofy`)
const Transaction = require(`${__dirname}/model/Transaction`)

let instance = null
let WalletManager = null
let Wallet = null

registerPromiseWorker(message => {
  if (message.event === 'init') {
    return config.init(message.data)
      .then((conf) => goofy.init(conf.server.fileLogLevel, conf.network.name + '_transactionPool'))
      .then(() => (WalletManager = requireFrom('core/walletManager')))
      .then(() => (Wallet = requireFrom('model/wallet.js')))
      .then(() => (instance = new TransactionPool()))
  }
  if (instance && instance[message.event]) {
    return instance[message.event](message.data)
  } else return Promise.reject(new Error(`message '${message}' not recognised`))
})

class TransactionPool {
  constructor () {
    const that = this
    this.walletManager = new WalletManager()

    this.pool = {}
    this.queue = async.queue((transaction, qcallback) => {
      that.verify(transaction)
      qcallback()
    }, 1)
  }

  start (wallets) {
    wallets.forEach(wallet => {
      let acc = new Wallet(wallet.address)
      acc = {...acc, ...wallet}
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

  addBlock (block) {
    return Promise.all(block.transactions.map(tx => {
      if (this.pool[tx.id]) {
        this.walletManager.undoTransaction(this.pool[tx.id])
        delete this.pool[tx.id]
      }
    }))
  }

  undoBlock (block) {
    return Promise.all(block.transactions.map(tx => this.addTransaction(tx)))
  }

  // rebuildBlockHeader (block) {

  // }
}

// module.exports = instance
