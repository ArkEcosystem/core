class BlocksRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.blocks.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.db.blocks.findAndCountAll(Object.assign(params, {
      offset: page * perPage,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.blocks.findById(id)
  }
}

module.exports = BlocksRepository
