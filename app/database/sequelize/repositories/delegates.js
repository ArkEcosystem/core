const { calculateApproval, calculateProductivity } = require('app/utils/delegate-calculator')

module.exports = class DelegatesRepository {
  constructor (db) {
    this.db = db
  }

  findAll (params = {}) {
    return Promise.resolve(this.db.walletManager.getLocalWallets().filter(a => !!a.username))
  }

  paginate (params) {
    return this.findAll().then((wallets) => ({
      rows: wallets.slice(params.offset, params.offset + params.limit),
      count: wallets.length
    }))
  }

  findById (id) {
    return this.findAll().then((wallets) => wallets.find(a => (a.address === id || a.publicKey === id || a.username === id)))
  }

  active (height, totalSupply) {
    return this.db.getActiveDelegates(height).then(delegates => {
      return Promise.all(delegates.map(delegate => {
        return this.db.wallets.findById(delegate.publicKey).then(wallet => {
          return {
            username: wallet.username,
            approval: calculateApproval(delegate),
            productivity: calculateProductivity(wallet)
          }
        })
      }))
    })
  }
}
