const _ = require('lodash')
const filterObject = requireFrom('helpers/filter-object')

class AccountsRepository {
  constructor (db) {
    this.db = db
  }

  findAll () {
    return Promise.resolve(this.db.accountManager.getLocalAccounts())
  }

  paginate (queryParams = {}) {
    return this.findAll().then((accounts) => ({
      count: accounts.length,
      rows: accounts.slice(queryParams.offset, queryParams.offset + queryParams.limit)
    }))
  }

  findAllByVote (publicKey, pager) {
    return this.findAll().then((accounts) => accounts.filter(a => a.vote === publicKey))
  }

  findById (id) {
    return this.findAll().then((accounts) => accounts.find(a => (a.address === id || a.publicKey === id || a.username === id)))
  }

  count () {
    return this.findAll().then((accounts) => accounts.length)
  }

  top (queryParams) {
    return this.findAll().then((accounts) => _.sortBy(accounts, 'balance').reverse())
  }

  search (queryParams) {
    return this.findAll().then((accounts) => filterObject(accounts, queryParams, {
      exact: ['address', 'publicKey', 'secondPublicKey', 'vote', 'username'],
      between: ['balance', 'votebalance']
    }).then(results => ({
      count: results.length,
      rows: results
    })))
  }
}

module.exports = AccountsRepository
