class DelegatesRepository {
  constructor (db) {
    this.db = db
  }

  all (params = {}) {
    return Promise.resolve(this._getLocalAccounts())
  }

  paginate (pager, queryParams = {}) {
    let offset = (pager.page > 1) ? pager.page * pager.perPage : 0

    const accounts = this._getLocalAccounts()

    return Promise.resolve({
      rows: accounts.slice(offset, offset + pager.limit),
      count: accounts.length
    })
  }

  findById (id) {
    return Promise.resolve(
      this
        ._getLocalAccounts()
        .find(a => (a.address === id || a.publicKey === id || a.username === id))
    )
  }

  _getLocalAccounts () {
    return this.db.accountManager.getLocalAccounts().filter(a => !!a.username)
  }
}

module.exports = DelegatesRepository
