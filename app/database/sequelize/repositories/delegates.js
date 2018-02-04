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
      return Promise.all(delegates.map(d => {
        return this.db.wallets.findById(d.publicKey).then(wallet => {
          return {
            username: wallet.username,
            approval: ((d.balance / totalSupply) * 100).toFixed(2),
            productivity: (100 - (wallet.missedBlocks / ((wallet.producedBlocks + wallet.missedBlocks) / 100))).toFixed(2)
          }
        })
      }))
    })
  }
}
