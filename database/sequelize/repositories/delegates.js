class DelegatesRepository {
  constructor (db) {
    this.db = db
  }

  all (params = {}) {
    return Promise.resolve(this._getLocalAccounts())
  }

  paginate (pager, queryParams = {}) {
    let offset = 0

    if (pager.offset > 1) offset = pager.offset * pager.limit

    const accounts = this._getLocalAccounts()

    return Promise.resolve({
      rows: accounts.slice(offset, offset + pager.limit),
      count: accounts.length
    })
  }

  findById (id) {
    return Promise.resolve(this._getLocalAccounts().find(a => {
      return (a.address === id || a.publicKey === id || a.username === id)
    }))
  }

  _getLocalAccounts () {
    return Object.values(this.db.localaccounts).filter(a => !!a.username)
  }
}

module.exports = DelegatesRepository
