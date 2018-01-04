class BlocksRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.blocksTable.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.db.blocksTable.findAndCountAll(Object.assign(params, {
      offset: page * perPage,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.blocksTable.findById(id)
  }
}

module.exports = BlocksRepository
