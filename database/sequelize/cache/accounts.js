const CacheDecorator = require('./cache')

class AccountsRepositoryCacheDecorator extends CacheDecorator {
  constructor (db) {
    super()

    this.db = db
  }

  all (queryParams) {
    return super.cachePromise(
      'all',
      { queryParams },
      this.db.accounts.all(queryParams)
    )
  }

  paginate (pager, queryParams = {}) {
    return super.cachePromise(
      'paginate',
      { queryParams },
      this.db.accounts.paginate(pager, queryParams)
    )
  }

  paginateByVote (publicKey, pager) {
    return super.cachePromise(
      'paginateByVote',
      { publicKey },
      this.db.accounts.paginateByVote(publicKey, pager)
    )
  }

  findById (id) {
    return super.cachePromise(
      'findById',
      { id },
      this.db.accounts.findById(id)
    )
  }

  count () {
    return super.cachePromise(
      'count',
      {},
      this.db.accounts.count()
    )
  }

  top (queryParams) {
    return super.cachePromise(
      'top',
      { queryParams },
      this.db.accounts.top(queryParams)
    )
  }

  getProducedBlocks (publicKey) {
    return super.cachePromise(
      'getProducedBlocks',
      { publicKey },
      this.db.accounts.getProducedBlocks(publicKey)
    )
  }
}

module.exports = AccountsRepositoryCacheDecorator
