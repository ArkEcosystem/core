'use strict'

const Op = require('sequelize').Op
const buildFilterQuery = require('./utils/filter-query')
const Sequelize = require('sequelize')

module.exports = class BlocksRepository {
  /**
   * Create a new block repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * Get all blocks for the given parameters.
   * @param  {Object}  params
   * @param  {Boolean} count
   * @return {Object}
   */
  findAll (params, count = true) {
    let whereStatement = {}
    let orderBy = []

    const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']

    for (const elem of filter) {
      if (params[elem]) {
        whereStatement[elem] = params[elem]
      }
    }

    params.orderBy
      ? orderBy.push([params.orderBy.split(':')])
      : orderBy.push([[ 'height', 'DESC' ]])

    return this.connection.models.block[count ? 'findAndCountAll' : 'findAll']({
      where: whereStatement,
      order: orderBy,
      offset: params.offset,
      limit: params.limit
    })
  }

  /**
   * Get all blocks for the given generator.
   * @param  {String} generatorPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllByGenerator (generatorPublicKey, paginator) {
    return this.findAll({...{generatorPublicKey}, ...paginator})
  }

  /**
   * Get a block.
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.connection.models.block.findById(id)
  }

  /**
   * Get the last block for the given generator.
   * @param  {String} generatorPublicKey
   * @return {Object}
   */
  findLastByPublicKey (generatorPublicKey) {
    return this.connection.models.block.findOne({
      limit: 1,
      where: { generatorPublicKey },
      order: [[ 'createdAt', 'DESC' ]],
      attributes: ['id', 'timestamp']
    })
  }

  /**
   * Get all transactions for the given range.
   * @param  {Number} from
   * @param  {Number} to
   * @return {Object}
   */
  findAllByDateTimeRange (from, to) {
    let where = { timestamp: {} }

    if (from) {
      where.timestamp[Op.lte] = to
    }

    if (to) {
      where.timestamp[Op.gte] = from
    }

    if (!where.timestamp.length) {
      delete where.timestamp
    }

    return this.connection.models.block.findAll({
      attributes: ['totalFee', 'reward'], where
    })
  }

  /**
   * Search all transactions.
   * @param  {Object} params
   * @return {Object}
   */
  search (params) {
    return this.connection.models.block.findAndCountAll({
      where: buildFilterQuery(params, {
        exact: ['id', 'version', 'previousBlock', 'payloadHash', 'generatorPublicKey', 'blockSignature'],
        between: ['timestamp', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength']
      })
    })
  }

  /**
   * Get fee and reward totals for the given generator.
   * @param  {String} generatorPublicKey
   * @return {Object}
   */
  totalsByGenerator (generatorPublicKey) {
    return this.connection.connection.query(`SELECT SUM("totalFee") AS fees, SUM("reward") as rewards, SUM("reward"+"totalFee") as forged FROM blocks WHERE "generatorPublicKey" = "${generatorPublicKey}"`, {
      type: Sequelize.QueryTypes.SELECT
    })
  }
}
