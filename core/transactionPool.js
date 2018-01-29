const async = require('async')
const arkjs = require('arkjs')
const registerPromiseWorker = require('promise-worker/register')
const config = require(`${__dirname}/core/config`)
const logger = require(`${__dirname}/core/logger`)

let instance = null
let AccountManager = null
let Account = null

registerPromiseWorker(message => {
  if (message.event === 'init') {
    return config.init(message.data)
      .then((conf) => logger.init(conf.server.fileLogLevel, conf.network.name+'_transactionPool'))
      .then(() => (AccountManager = requireFrom('core/accountManager')))
      .then(() => (Account = requireFrom('model/account.js')))
      .then(() => (instance = new TransactionPool()))
  }
  if (instance && instance[message.event]) {
    return instance[message.event](message.data)
  } else return Promise.reject(new Error(`message '${message}' not recognised`))
})

class TransactionPool {
  constructor () {
    const that = this
    this.accountManager = new AccountManager()

    this.pool = {}
    this.queue = async.queue((transaction, qcallback) => {
      that.verify(transaction)
      qcallback()
    }, 1)
  }

  start (accounts) {
    accounts.forEach(account => {
      let acc = new Account(account.address)
      acc = {...acc, ...account}
      instance.accountManager.updateAccount(acc)
    })
    return Promise.resolve()
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

// module.exports = instance
