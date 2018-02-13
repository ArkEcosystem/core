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

  search (params) {
    let query = this.findAll()
      .then((delegates) => delegates.filter((delegate) => delegate.username.indexOf(params.q) > -1))

    if (params.orderBy) {
      const orderByField = params.orderBy.split(':')[0]
      const orderByDirection = params.orderBy.split(':')[1] || 'desc'

      query = query.then((delegates) => delegates.sort((a, b) => {
        if (orderByDirection === 'desc' && (a[orderByField] < b[orderByField])) return -1
        if (orderByDirection === 'asc' && (a[orderByField] > b[orderByField])) return 1

        return 0
      }))
    }

    return query.then((delegates) => ({
      rows: delegates.slice(params.offset, params.offset + params.limit),
      count: delegates.length
    }))
  }

  async findById (id) {
    const delegates = await this.findAll()

    return delegates.find(a => (a.address === id || a.publicKey === id || a.username === id))
  }

  async active (height, totalSupply) {
    const delegates = await this.db.getActiveDelegates(height)

    return Promise.all(delegates.map(delegate => {
      return this.db.wallets.findById(delegate.publicKey).then(wallet => {
        return {
          username: wallet.username,
          approval: calculateApproval(delegate),
          productivity: calculateProductivity(wallet)
        }
      })
    }))
  }
}
