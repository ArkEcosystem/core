const Sequelize = require('sequelize')

class TransactionsRepository {
  constructor(db) {
    this.db = db
  }

  all(params = {}) {
    // TODO sql migration - add height block to TX table - much much faster !!!
    params['include'] = [{
      model: this.db.blocksTable,
      attributes: ['height']
    }]
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
