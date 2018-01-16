const CacheDecorator = require('./cache')

class DelegatesRepositoryCacheDecorator extends CacheDecorator {
  constructor (db) {
    super()

    this.db = db
  }

  all (params = {}) {
    return super.cachePromise(
      'all',
      { params },
      this.db.delegates.all(params)
    )
  }

  paginate (pager, params = {}) {
    return super.cachePromise(
      'paginate',
      { params },
      this.db.delegates.paginate(pager, params)
    )
  }

  findById (id) {
    return super.cachePromise(
      'findById',
      { id },
      this.db.delegates.findById(id)
    )
  }
}

module.exports = DelegatesRepositoryCacheDecorator
