const _ = require('lodash')
const filterObject = require('./utils/filter-object')

module.exports = class WalletsRepository {
  constructor (db) {
    this.db = db
  }

  async findAll (params = {}) {
    const wallets = this.db.walletManager.getLocalWallets()

    return Object.keys(params).length ? {
      rows: wallets.slice(params.offset, params.offset + params.limit),
      count: wallets.length
    } : wallets
  }

  async paginate (params = {}) {
    const wallets = await this.findAll()

    return {
      count: wallets.length,
      rows: wallets.slice(params.offset, params.offset + params.limit)
    }
  }

  async findAllByVote (publicKey, params = {}) {
    let wallets = await this.findAll()
    wallets = await wallets.filter(a => a.vote === publicKey)

    return Object.keys(params).length ? {
      rows: wallets.slice(params.offset, params.offset + params.limit),
      count: wallets.length
    } : wallets
  }

  async findById (id) {
    const wallets = await this.findAll()

    return wallets.find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  async count () {
    const wallets = await this.findAll()

    return wallets.length
  }

  async top (params, legacy = false) {
    let wallets = await this.findAll()

    wallets = _.sortBy(wallets, 'balance').reverse()
    wallets = wallets.slice(params.offset, params.offset + params.limit)

    return legacy ? wallets : {
      rows: wallets.slice(params.offset, params.offset + params.limit),
      count: wallets.length
    }
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
