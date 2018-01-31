const Op = require('sequelize').Op
const moment = require('moment')
const buildFilterQuery = require('../utils/filter-query')

module.exports = class BlocksRepository {
  constructor (db) {
    this.db = db
  }

findAll (params) {
    let whereStatement = {}
    let orderBy = []

    const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']
    for (const elem of filter) {
      if (params[elem]) whereStatement[elem] = params[elem]
    }

    // @TODO - orderBy is v1, sort is for v2
    if (params.orderBy) orderBy.push(params.orderBy.split(':'))

    return this.db.blocksTable.findAndCountAll({
      where: whereStatement,
      order: orderBy,
      offset: params.offset,
      limit: params.limit
    })
  }

  findAllByGenerator (generatorPublicKey, paginator) {
    return this.findAll({...{generatorPublicKey}, ...paginator})
  }

  findById (id) {
    return this.db.blocksTable.findById(id)
  }

  findLastByPublicKey (generatorPublicKey) {
    return this.db.blocksTable.findOne({
      limit: 1,
      where: { generatorPublicKey },
      order: [[ 'createdAt', 'DESC' ]]
    })
  }

  findAllByDateTimeRange (from, to) {
    return this.db.blocksTable.findAndCountAll({
      attributes: ['totalFee', 'reward'],
      where: {
        createdAt: {
          [Op.lte]: moment(to).endOf('day').toDate(),
          [Op.gte]: moment(from).startOf('day').toDate()
        }
      }
    })
  }

  search (params) {
    return this.db.blocksTable.findAndCountAll({
      where: buildFilterQuery(params, {
        exact: ['id', 'version', 'previousBlock', 'payloadHash', 'generatorPublicKey', 'blockSignature'],
        between: ['timestamp', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength']
      })
    })
  }
}
