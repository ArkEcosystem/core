const Op = require('sequelize').Op
const moment = require('moment')
const buildFilterQuery = require('../utils/filter-query')
const Sequelize = require('sequelize')

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

    params.orderBy
      ? orderBy.push(params.orderBy.split(':'))
      : orderBy.push([[ 'height', 'DESC' ]])

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
      order: [[ 'timestamp', 'DESC' ]],
      attributes: ['id', 'timestamp']
    })
  }

  findAllByDateTimeRange (from, to) {
    let where = { timestamp: {} }

    if (from) where.timestamp[Op.lte] = to
    if (to) where.timestamp[Op.gte] = from
    if (!where.timestamp.length) delete where.timestamp

    return this.db.blocksTable.findAndCountAll({
      attributes: ['totalFee', 'reward'], where
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

  totalsByGenerator (generatorPublicKey) {
    return this.db.db.query(`SELECT SUM(totalFee) AS fees, SUM(reward) as rewards, SUM(reward+totalFee) as forged FROM blocks WHERE generatorPublicKey = "${generatorPublicKey}"`, {
      type: Sequelize.QueryTypes.SELECT
    })
  }
}
