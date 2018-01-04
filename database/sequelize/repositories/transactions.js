class TransactionsRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.transactionsTable.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.db.transactionsTable.findAndCountAll(Object.assign(params, {
      offset: page * perPage,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.transactionsTable.findById(id)
  }

  findByIdAndType(id, type) {
    return this.db.transactionsTable.findOne({
      where: {
        id: id,
        type: type,
      }
    })
  }
}

module.exports = TransactionsRepository
