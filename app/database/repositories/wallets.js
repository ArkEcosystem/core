const _ = require('lodash')
const filterObject = require('app/utils/filter-object')

module.exports = class WalletsRepository {
  constructor (db) {
    this.db = db
  }

  async findAll (params = {}) {
    const wallets = this.db.walletManager.getLocalWallets()

    return Object.keys(params).length ? {
      results: wallets.slice(params.offset, params.offset + params.limit),
      total: wallets.length
    } : wallets
  }

  async paginate (params = {}) {
    const wallets = await this.findAll()

    return {
      results: wallets.slice(params.offset, params.offset + params.limit),
      total: wallets.length
    }
  }

  async findAllByVote (publicKey, params = {}) {
    let wallets = await this.findAll()
    wallets = await wallets.filter(a => a.vote === publicKey)

    return Object.keys(params).length ? {
      results: wallets.slice(params.offset, params.offset + params.limit),
      total: wallets.length
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
      results: wallets,
      total: wallets.length
    }
  }
}
