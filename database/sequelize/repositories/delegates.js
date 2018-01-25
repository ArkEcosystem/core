class DelegatesRepository {
  constructor (db) {
    this.db = db
  }

  all (params = {}) {
    return Promise.resolve(this.db.accountManager.getLocalAccounts().filter(a => !!a.username))
  }

  paginate (pager, queryParams = {}) {
    return this.all().then((accounts) => ({
      rows: accounts.slice(pager.offset, pager.offset + pager.limit),
      count: accounts.length
    }))
  }

  findById (id) {
    return this.all().then((accounts) => accounts.find(a => (a.address === id || a.publicKey === id || a.username === id)))
  }
}

module.exports = DelegatesRepository
