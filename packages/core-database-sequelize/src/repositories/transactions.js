'use strict';

const Op = require('sequelize').Op
const { Transaction } = require('@arkecosystem/client').models
const { TRANSACTION_TYPES } = require('@arkecosystem/client').constants
const buildFilterQuery = require('./utils/filter-query')

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class TransactionsRepository {
  /**
   * [constructor description]
   * @param  {[type]} db [description]
   * @return {[type]}    [description]
   */
  constructor (db) {
    this.db = db
  }

  /**
   * [findAll description]
   * @param  {[type]} params [description]
   * @return {[type]}        [description]
   */
  findAll (params) {
    let whereStatement = {}
    let orderBy = []

    const filter = ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId']
    for (const elem of filter) {
      if (params[elem]) { whereStatement[elem] = params[elem] }
    }

    if (params['senderId']) {
      let wallet = this.db.walletManager.getWalletByAddress([params['senderId']])

      if (wallet) whereStatement['senderPublicKey'] = wallet.publicKey
    }

    params.orderBy
      ? orderBy.push([params.orderBy.split(':')])
      : orderBy.push([['timestamp', 'DESC']])

    return this.db.models.transaction.findAndCountAll({
      attributes: ['blockId', 'serialized'],
      where: whereStatement,
      order: orderBy,
      offset: params.offset,
      limit: params.limit,
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })
  }

  /**
   * [findAllByWallet description]
   * @param  {[type]} wallet    [description]
   * @param  {[type]} paginator [description]
   * @return {[type]}           [description]
   */
  findAllByWallet (wallet, paginator) {
    return this.findAll({
      ...{
        [Op.or]: [{
          senderPublicKey: wallet.publicKey
        }, {
          recipientId: wallet.address
        }]
      },
      ...paginator
    })
  }

  /**
   * [findAllBySender description]
   * @param  {[type]} senderPublicKey [description]
   * @param  {[type]} paginator       [description]
   * @return {[type]}                 [description]
   */
  findAllBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey}, ...paginator})
  }

  /**
   * [findAllByRecipient description]
   * @param  {[type]} recipientId [description]
   * @param  {[type]} paginator   [description]
   * @return {[type]}             [description]
   */
  findAllByRecipient (recipientId, paginator) {
    return this.findAll({...{recipientId}, ...paginator})
  }

  /**
   * [allVotesBySender description]
   * @param  {[type]} senderPublicKey [description]
   * @param  {[type]} paginator       [description]
   * @return {[type]}                 [description]
   */
  allVotesBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey, type: TRANSACTION_TYPES.VOTE}, ...paginator})
  }

  /**
   * [findAllByBlock description]
   * @param  {[type]} blockId   [description]
   * @param  {[type]} paginator [description]
   * @return {[type]}           [description]
   */
  findAllByBlock (blockId, paginator) {
    return this.findAll({...{blockId}, ...paginator})
  }

  /**
   * [findAllByType description]
   * @param  {[type]} type      [description]
   * @param  {[type]} paginator [description]
   * @return {[type]}           [description]
   */
  findAllByType (type, paginator) {
    return this.findAll({...{type}, ...paginator})
  }

  /**
   * [findById description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  findById (id) {
    return this.db.models.transaction.findById(id, {
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })
  }

  /**
   * [findByTypeAndId description]
   * @param  {[type]} type [description]
   * @param  {[type]} id   [description]
   * @return {[type]}      [description]
   */
  findByTypeAndId (type, id) {
    return this.db.models.transaction.findOne({
      where: {id, type},
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })
  }

  /**
   * [findAllByDateAndType description]
   * @param  {[type]} type [description]
   * @param  {[type]} from [description]
   * @param  {[type]} to   [description]
   * @return {[type]}      [description]
   */
  async findAllByDateAndType (type, from, to) {
    let where = { type, timestamp: {} }

    if (from) where.timestamp[Op.lte] = to
    if (to) where.timestamp[Op.gte] = from
    if (!where.timestamp.length) delete where.timestamp

    const results = await this.db.models.transaction.findAll({
      attributes: ['serialized'],
      where,
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })

    return results.map(row => Transaction.deserialize(row.serialized.toString('hex')))
  }

  /**
   * [search description]
   * @param  {[type]} payload [description]
   * @return {[type]}         [description]
   */
  search (payload) {
    let orderBy = []

    payload.orderBy
      ? orderBy.push([payload.orderBy.split(':')])
      : orderBy.push([['timestamp', 'DESC']])

    return this.db.models.transaction.findAndCountAll({
      attributes: ['blockId', 'serialized'],
      where: buildFilterQuery(
        payload,
        {
          exact: ['id', 'blockId', 'type', 'version', 'senderPublicKey', 'recipientId'],
          between: ['timestamp', 'amount', 'fee'],
          wildcard: ['vendorFieldHex']
        }
      ),
      order: orderBy,
      offset: payload.offset,
      limit: payload.limit,
      include: {
        model: this.db.models.block,
        attributes: ['height']
      }
    })
  }
}
