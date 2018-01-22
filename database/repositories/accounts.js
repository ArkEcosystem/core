const _ = require('lodash')

class AccountsRepository {
  constructor (db) {
    this.db = db
  }

  all () {
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

  paginateByVote (publicKey, pager) {
    return Promise.resolve(this._getLocalAccounts().filter(a => a.vote === publicKey))
  }

  findById (id) {
    return Promise.resolve(this._getLocalAccounts().find(a => {
      return (a.address === id || a.publicKey === id || a.username === id)
    }))
  }

  findAllByVote (publicKey) {
    return Promise.resolve(this._getLocalAccounts().filter(a => a.vote === publicKey))
  }

  count () {
    return Promise.resolve(this._getLocalAccounts().length)
  }

  top (queryParams) {
    return Promise.resolve(_.sortBy(this._getLocalAccounts(), 'balance').reverse())
  }

  getProducedBlocks (generatorPublicKey) {
    return this.db.blocksTable.count({ where: { generatorPublicKey } })
  }

  _getLocalAccounts () {
    return Object.values(this.db.localaccounts)
  }

  search(queryParams) {
    let where = {}

    const exactFilters = ['address', 'publicKey', 'secondPublicKey', 'vote', 'username']
    const betweenFilters = ['balance', 'votebalance']
    return Promise.resolve(this._getLocalAccounts().filter(account => {
      for (const elem of exactFilters) {
        if (queryParams[elem] && account[elem] !== queryParams[elem]) {
          return false
        }
      }
      for (const elem of betweenFilters) {
        if (!queryParams[elem]) {
          continue;
        }
        if (!queryParams[elem].from && !queryParams[elem].to && account[elem] !== queryParams[elem]) {
          return false
        } else if (queryParams[elem].from || queryParams[elem].to) {
          let isLessThan = true
          let isMoreThan = true

          if (queryParams[elem].from) {
            isMoreThan = false
            if (elem === 'createdAt') {
              isMoreThan = account[elem] >= moment(queryParams[elem].from).endOf('day').toDate()
            } else {
              isMoreThan = account[elem] >= queryParams[elem].from
            }
          }
          if (queryParams[elem].to) {
            isLessThan = false
            if (elem === 'createdAt') {
              isLessThan = account[elem] <= moment(queryParams[elem].from).endOf('day').toDate()
            } else {
              isLessThan = account[elem] <= queryParams[elem].from
            }
          }

          if (!isLessThan || !isMoreThan) {
            return false
          }
        }
      }
    }))
  }
}

module.exports = AccountsRepository
