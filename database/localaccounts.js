// TODO implement
class LocalAccountsRepository {
  constructor (db) {
    this.db = db
  }

  all () {
    return this.db.localaccounts
  }

  paginate (params, page, perPage) {
    /* return this.all(Object.assign(params, {
      offset: page * perPage,
      limit: perPage,
    })) */
  }

  findById (id) {
    for (const account of this.db.localaccounts) {
      if (account.address === id) { return Promise.resolve(account) }
      if (account.publicKey === id) { return Promise.resolve(account) }
      if (account.username === id) { return Promise.resolve(account) }
    }
  }
}

module.exports = LocalAccountsRepository
