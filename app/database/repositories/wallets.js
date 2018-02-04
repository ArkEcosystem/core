const _ = require('lodash')
const filterObject = require('app/utils/filter-object')

module.exports = class WalletsRepository {
  constructor (db) {
    this.db = db
  }

  findAll () {
    return Promise.resolve(this.db.walletManager.getLocalWallets())
  }

  paginate (params = {}) {
    return this.findAll().then((wallets) => ({
      count: wallets.length,
      rows: wallets.slice(params.offset, params.offset + params.limit)
    }))
  }

  findAllByVote (publicKey, pager) {
    return this.findAll().then((wallets) => wallets.filter(a => a.vote === publicKey))
  }

  findById (id) {
    return this.findAll().then((wallets) => wallets.find(a => (a.address === id || a.publicKey === id || a.username === id)))
  }

  count () {
    return this.findAll().then((wallets) => wallets.length)
  }

  top (params) {
    return this.findAll().then((wallets) => _.sortBy(wallets, 'balance').reverse())
  }

  search (params) {
    return this.findAll().then((wallets) => filterObject(wallets, params, {
      exact: ['address', 'publicKey', 'secondPublicKey', 'vote', 'username'],
      between: ['balance', 'votebalance']
    }).then(results => ({
      count: results.length,
      rows: results
    })))
  }
}
