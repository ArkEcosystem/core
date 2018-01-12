class BlocksRepository {
  constructor(db) {
    this.db = db
  }

  all(queryParams) {

    let whereStatement = {}
    let orderBy = []

    const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']
    for (const elem of filter) {
      if (!!queryParams[elem])
        whereStatement[elem] = queryParams[elem]
    }

    if (!!queryParams.orderBy) {
      orderBy.push(queryParams.orderBy.split(':'))
    }

    return this.db.blocksTable.findAndCountAll({
      where: whereStatement,
      order: orderBy,
      offset: parseInt(queryParams.offset || 1),
      limit: parseInt(queryParams.limit || 100)
    })
  }

  findById(id) {
    return this.db.blocksTable.findById(id)
  }
}

module.exports = BlocksRepository
