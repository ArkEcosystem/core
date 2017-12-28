const blockchain = requireFrom('core/blockchainManager')

class TransactionsRepository {
  constructor() {
    this.db = blockchain.getInstance().getDb()
  }

  all(params = {}) {
    return this.db.transactions.findAndCountAll(params)
  }

  paginate(params, page, perPage) {
    return this.db.transactions.findAndCountAll(Object.assign(params, {
      offset: page > 1 ? page * perPage : 0,
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

module.exports = new TransactionsRepository
