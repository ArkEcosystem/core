const moment = require('moment')
const buildFilterQuery = require('../utils/filter-query')

module.exports = class BlocksRepository {
  constructor (db) {
    this.db = db
  }

  async findAll (params, columns = ['*']) {
    let query = this.db.blocksModel.query().select(columns)

    const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']
    for (const elem of filter) {
      if (params[elem]) {
        query.where(elem, params[elem])
      }
    }

    if (params.orderBy) {
      const [column, direction] = params.orderBy.split(':')
      query.orderBy(column, direction)
    } else {
      query.orderBy('height', 'desc')
    }

    return query.offset(params.offset).limit(params.limit).range()
  }

  findAllByGenerator (generatorPublicKey, paginator) {
    return this.findAll({...{generatorPublicKey}, ...paginator})
  }

  findById (id) {
    return this.db.blocksModel.query().where('id', id).first()
  }

  findLastByPublicKey (generatorPublicKey) {
    return this.db.blocksModel.query()
      .select('id', 'timestamp')
      .where('generatorPublicKey', generatorPublicKey)
      .orderBy('timestamp', 'desc')
      .first()
  }

  findAllByDateTimeRange (start, end) {
    let query = this.db.blocksModel.query().select('totalFee', 'reward')

    // TODO: rework this to allow passing in real timestamps and not the genesis mambo jambo
    const epoch = moment.unix(1490101200).utc()

    if (start) {
      start = moment(start).startOf('day').utc()

      if (start.unix() < epoch.unix()) start = epoch

      query.where('timestamp', '>=', start.diff(epoch))
    }

    if (end) {
      end = moment(end).endOf('day').utc()

      query.where('timestamp', '<=', end.diff(epoch))
    }

    return query.range()
  }

  search (params, columns = ['*']) {
    let query = this.db.blocksModel.query().select(columns)

    return buildFilterQuery(query, params, {
      exact: ['id', 'version', 'previousBlock', 'payloadHash', 'generatorPublicKey', 'blockSignature'],
      between: ['timestamp', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength']
    }).offset(params.offset).limit(params.limit).range()
  }

  totalsByGenerator (generatorPublicKey) {
    // return this.db.db.query(`SELECT SUM(totalFee) AS fees, SUM(reward) as rewards, SUM(reward+totalFee) as forged FROM blocks WHERE generatorPublicKey = "${generatorPublicKey}"`, {
    //   type: Sequelize.QueryTypes.SELECT
    // })

    return this.db.blocksModel.query()
      .select(
        this.db.db.raw('SUM(totalFee) as fees'),
        this.db.db.raw('SUM(reward) as rewards'),
        this.db.db.raw('SUM(reward+totalFee) as forged')
      )
      .where('generatorPublicKey', generatorPublicKey)
  }
}
