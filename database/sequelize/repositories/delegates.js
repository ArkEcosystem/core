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
}
