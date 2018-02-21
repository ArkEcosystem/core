const moment = require('moment')
const buildFilterQuery = require('../utils/filter-query')
const Sequelize = require('sequelize')

module.exports = class BlocksRepository {
  constructor (db) {
    this.db = db
  }

  findAll (params) {
    let query = this.db.blocksTable.query()

    const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']
    for (const elem of filter) {
      if (params[elem]) {
        query = query.where(elem, params[elem])
      }
    }

    if (params.orderBy) {
      const [column, direction] = params.orderBy.split(':')
      query = query.orderBy(column, direction)
    } else {
      query = query.orderBy('height', 'desc')
    }

    return query.offset(params.offset).limit(params.limit)
  }

  findAllByGenerator (generatorPublicKey, paginator) {
    return this.findAll({...{generatorPublicKey}, ...paginator})
  }

  findById (id) {
    return this.db.blocksTable.query().findById(id)
  }

  findLastByPublicKey (generatorPublicKey) {
    return this.db.blocksTable.query()
      .select('id', 'timestamp')
      .where('generatorPublicKey', generatorPublicKey)
      .orderBy('created_at', 'desc')
      .first()
  }

  findAllByDateTimeRange (from, to) {
    const query = this.db.blocksTable.query()
      .select('totalFee', 'reward')
      .whereBetween('created_at', [
        moment(to).endOf('day').toDate(),
        moment(from).startOf('day').toDate()
      ])

    return {
      count: query.count(),
      rows: query
    }
  }

  search (params) {
    let query = this.db.blocksTable.query()
      .select('*', this.db.raw('COUNT(*) AS count'))

    query = buildFilterQuery(query, params, {
      exact: ['id', 'version', 'previousBlock', 'payloadHash', 'generatorPublicKey', 'blockSignature'],
      between: ['timestamp', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength']
    })

    return {
      count: query.count,
      rows: query
    }
  }

  totalsByGenerator (generatorPublicKey) {
    return this.db.blocksTable.query()
      .select(
        this.db.raw('SUM(totalFee) AS fees'),
        this.db.raw('SUM(reward) AS rewards'),
        this.db.raw('SUM(reward+totalFee) AS forged')
      )
      .where('generatorPublicKey', generatorPublicKey)
  }
}
