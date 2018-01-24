const _ = require('lodash')
const filterObject = requireFrom('helpers/filter-object')

class AccountsRepository {
  constructor (db) {
    this.db = db
  }

  all () {
    return Promise.resolve(Object.values(this.db.localaccounts))
  }

  paginate (pager, queryParams = {}) {
    let offset = (pager.page > 1) ? pager.page * pager.perPage : 0

    return this.all().then((accounts) => ({
      count: accounts.length,
      rows: accounts.slice(offset, offset + pager.limit)
    }))
  }

  paginateByVote (publicKey, pager) {
    return this.all().then((accounts) => accounts.filter(a => a.vote === publicKey))
  }

  findById (id) {
    return this.all().then((accounts) => accounts.find(a => (a.address === id || a.publicKey === id || a.username === id)))
  }

  findAllByVote (publicKey) {
    return this.all().then((accounts) => accounts.filter(a => a.vote === publicKey))
  }

  count () {
    return this.all().then((accounts) => accounts.length)
  }

  top (queryParams) {
    return this.all().then((accounts) => _.sortBy(accounts, 'balance').reverse())
  }

  search (queryParams) {
    return this.all().then((accounts) => {
      return filterObject(accounts, queryParams, {
        exact: ['address', 'publicKey', 'secondPublicKey', 'vote', 'username'],
        between: ['balance', 'votebalance']
      }).then(results => ({
        count: results.length,
        rows: results
      }))
    })
  }
}

module.exports = AccountsRepository
