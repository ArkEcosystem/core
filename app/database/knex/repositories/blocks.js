const moment = require('moment')
const buildFilterQuery = require('../utils/filter-query')

module.exports = class BlocksRepository {
  constructor (db) {
    this.db = db
  }

  async findAll (params, columns = ['*']) {
    let query = this.db.blocksTable.query().select(columns)

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

    return query.offset(params.offset).limit(params.limit).range()
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
    return this.db.blocksTable.query()
      .select('totalFee', 'reward')
      .whereBetween('created_at', [
        moment(to).endOf('day').toDate(),
        moment(from).startOf('day').toDate()
      ])
      .range()
  }

  search (params, columns = ['*']) {
    let query = this.db.blocksTable.query().select(columns)

    return buildFilterQuery(query, params, {
      exact: ['id', 'version', 'previousBlock', 'payloadHash', 'generatorPublicKey', 'blockSignature'],
      between: ['timestamp', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength']
    }).offset(params.offset).limit(params.limit).range()
  }

  totalsByGenerator (generatorPublicKey) {
    return this.db.blocksTable.query()
      .select(
        this.db.raw('SUM(totalFee) as fees'),
        this.db.raw('SUM(reward) as rewards'),
        this.db.raw('SUM(reward+totalFee) as forged')
      )
      .where('generatorPublicKey', generatorPublicKey)
  }
}
