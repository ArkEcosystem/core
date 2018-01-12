const Sequelize = require('sequelize')

class TransactionsRepository {
  constructor(db) {
    this.db = db
  }

  all(queryParams) {
    let whereStatement = {}
    let orderBy = []

    const filter = ['type', 'senderPublicKey', 'vendorField', 'senderId', 'recipientId', 'amount', 'fee', 'blockId']
    for (const elem of filter) {
      if (!!queryParams[elem])
        whereStatement[elem] = queryParams[elem]
    }

    if (!!queryParams.orderBy){
      orderBy.push(queryParams.orderBy.split(':'))
    }
    return this.db.transactionsTable.findAndCountAll({
      where: whereStatement,
      order: orderBy,
      offset: parseInt(queryParams.offset || 1),
      limit: parseInt(queryParams.limit || 100),
      include: {
        model: this.db.blocksTable,
        attributes: ['height'],
      }
    })
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
