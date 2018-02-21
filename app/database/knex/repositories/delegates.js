const { calculateApproval, calculateProductivity } = require('app/utils/delegate-calculator')

module.exports = class DelegatesRepository {
  constructor (db) {
    this.db = db
  }

  async findAll (params = {}) {
    return this.db.walletManager.getLocalWallets().filter(a => !!a.username)
  }

  async paginate (params) {
    const delegates = await this.findAll()

    return {
      rows: delegates.slice(params.offset, params.offset + params.limit),
      count: delegates.length
    }
  }

  async search (params) {
    let delegates = await this.findAll()
    delegates = delegates.filter((delegate) => delegate.username.indexOf(params.q) > -1)

    if (params.orderBy) {
      const orderByField = params.orderBy.split(':')[0]
      const orderByDirection = params.orderBy.split(':')[1] || 'desc'

      delegates = delegates.sort((a, b) => {
        if (orderByDirection === 'desc' && (a[orderByField] < b[orderByField])) return -1
        if (orderByDirection === 'asc' && (a[orderByField] > b[orderByField])) return 1

        return 0
      })
    }

    return {
      rows: delegates.slice(params.offset, params.offset + params.limit),
      count: delegates.length
    }
  }

  async findById (id) {
    const delegates = await this.findAll()

    return delegates.find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  async active (height, totalSupply) {
    const delegates = await this.db.getActiveDelegates(height)

    return Promise.all(delegates.map(async delegate => {
      const wallet = await this.db.wallets.findById(delegate.publicKey)

      return {
        username: wallet.username,
        approval: calculateApproval(wallet),
        productivity: calculateProductivity(wallet)
      }
    }))
  }
}
