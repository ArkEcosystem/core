class DelegatesRepository {
  constructor (db) {
    this.db = db
  }

  all (params = {}) {
    return Promise.resolve(Object.values(this.db.localaccounts).filter(a => !!a.username))
  }

  paginate (pager, queryParams = {}) {
    let offset = (pager.page > 1) ? pager.page * pager.perPage : 0

    return this.all().then((accounts) => ({
      rows: accounts.slice(offset, offset + pager.limit),
      count: accounts.length
    }))
  }

  findById (id) {
    return this.all().then((accounts) => accounts.find(a => (a.address === id || a.publicKey === id || a.username === id)))
  }
}

module.exports = DelegatesRepository
