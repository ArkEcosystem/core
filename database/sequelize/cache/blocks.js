const CacheDecorator = require('./cache')

class BlocksRepositoryCacheDecorator extends CacheDecorator {
  constructor (db) {
    super()

    this.db = db
  }

  all (queryParams) {
    return super.cachePromise(
      'all',
      { queryParams },
      this.db.blocks.all(queryParams)
    )
  }

  paginate (pager, queryParams = {}) {
    return super.cachePromise(
      'paginate',
      { queryParams, pager },
      this.db.blocks.paginate(pager, queryParams)
    )
  }

  paginateByGenerator (generatorPublicKey, pager) {
    return super.cachePromise(
      'paginateByGenerator',
      { generatorPublicKey, pager },
      this.db.blocks.paginateByGenerator(generatorPublicKey, pager)
    )
  }

  findById (id) {
    return super.cachePromise(
      'findById',
      { id },
      this.db.blocks.findById(id)
    )
  }

  findLastByPublicKey (publicKey) {
    return super.cachePromise(
      'findLastByPublicKey',
      { publicKey },
      this.db.blocks.findLastByPublicKey(publicKey)
    )
  }

  allByDateTimeRange (from, to) {
    return super.cachePromise(
      'allByDateTimeRange',
      { from, to },
      this.db.blocks.allByDateTimeRange(from, to)
    )
  }
}

module.exports = BlocksRepositoryCacheDecorator
