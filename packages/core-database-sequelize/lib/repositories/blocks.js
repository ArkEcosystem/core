'use strict';

const Op = require('sequelize').Op
const buildFilterQuery = require('./utils/filter-query')
const Sequelize = require('sequelize')

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class BlocksRepository {
  /**
   * [constructor description]
   * @param  {[type]} db [description]
   * @return {[type]}    [description]
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * [findAll description]
   * @param  {[type]}  params [description]
   * @param  {Boolean} count  [description]
   * @return {[type]}         [description]
   */
  findAll (params, count = true) {
    let whereStatement = {}
    let orderBy = []

    const filter = ['generatorPublicKey', 'totalAmount', 'totalFee', 'reward', 'previousBlock', 'height']
    for (const elem of filter) {
      if (params[elem]) whereStatement[elem] = params[elem]
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
   * [findAllByGenerator description]
   * @param  {[type]} generatorPublicKey [description]
   * @param  {[type]} paginator          [description]
   * @return {[type]}                    [description]
   */
  findAllByGenerator (generatorPublicKey, paginator) {
    return this.findAll({...{generatorPublicKey}, ...paginator})
  }

  /**
   * [findById description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  findById (id) {
    return this.connection.models.block.findById(id)
  }

  /**
   * [findLastByPublicKey description]
   * @param  {[type]} generatorPublicKey [description]
   * @return {[type]}                    [description]
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
   * [findAllByDateTimeRange description]
   * @param  {[type]} from [description]
   * @param  {[type]} to   [description]
   * @return {[type]}      [description]
   */
  findAllByDateTimeRange (from, to) {
    let where = { timestamp: {} }

    if (from) where.timestamp[Op.lte] = to
    if (to) where.timestamp[Op.gte] = from
    if (!where.timestamp.length) delete where.timestamp

    return this.connection.models.block.findAll({
      attributes: ['totalFee', 'reward'], where
    })
  }

  /**
   * [search description]
   * @param  {[type]} params [description]
   * @return {[type]}        [description]
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
   * [totalsByGenerator description]
   * @param  {[type]} generatorPublicKey [description]
   * @return {[type]}                    [description]
   */
  totalsByGenerator (generatorPublicKey) {
    return this.connection.connection.query(`SELECT SUM("totalFee") AS fees, SUM("reward") as rewards, SUM("reward"+"totalFee") as forged FROM blocks WHERE "generatorPublicKey" = "${generatorPublicKey}"`, {
      type: Sequelize.QueryTypes.SELECT
    })
  }
}
