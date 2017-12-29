class TransactionsRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    return this.db.transactions.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.db.transactions.findAndCountAll(Object.assign(params, {
      offset: page * perPage,
      limit: perPage,
    }))
  }

  findById(id) {
    return this.db.transactions.findById(id)
  }

  findByIdAndType(id, type) {
    return this.db.transactions.findOne({
      where: {
        id: id,
        type: type,
      }
    })
  }
}

module.exports = TransactionsRepository
