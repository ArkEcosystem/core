const _ = require('lodash')
const filterObject = require('app/utils/filter-object')

module.exports = class WalletsRepository {
  constructor (db) {
    this.db = db
  }

  async findAll () {
    return this.db.walletManager.getLocalWallets()
  }

  async paginate (params = {}) {
    const wallets = await this.findAll()

    return {
      count: wallets.length,
      rows: wallets.slice(params.offset, params.offset + params.limit)
    }
  }

  async findAllByVote (publicKey, params = {}) {
    let query = await this.findAll()
    query = query.filter(a => a.vote === publicKey)

    return params ? {
      rows: query.slice(params.offset, params.offset + params.limit),
      count: query.length
    } : query
  }

  async findById (id) {
    const wallets = await this.findAll()

    return wallets.find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  async count () {
    const wallets = await this.findAll()

    return wallets.length
  }

  async top (params) {
    const wallets = await this.findAll()

    return _.sortBy(wallets, 'balance').reverse()
  }

  async search (params) {
    let wallets = await this.findAll()

    wallets = await filterObject(wallets, params, {
      exact: ['address', 'publicKey', 'secondPublicKey', 'vote', 'username'],
      between: ['balance', 'votebalance']
    })

    return {
      count: wallets.length,
      rows: wallets
    }
  }
}
