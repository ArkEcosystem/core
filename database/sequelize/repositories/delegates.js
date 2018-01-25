class DelegatesRepository {
  constructor (db) {
    this.db = db
  }

  findAll (params = {}) {
    return Promise.resolve(this.db.accountManager.getLocalAccounts().filter(a => !!a.username))
  }

  paginate (params) {
    return this.findAll().then((accounts) => ({
      rows: accounts.slice(params.offset, params.offset + params.limit),
      count: accounts.length
    }))
  }

  findById (id) {
    return this.findAll().then((accounts) => accounts.find(a => (a.address === id || a.publicKey === id || a.username === id)))
  }
}

module.exports = DelegatesRepository
