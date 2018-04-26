'use strict';

const Op = require('sequelize').Op

const client = require('@arkecosystem/client')
const { Transaction } = client.models
const { TRANSACTION_TYPES } = client.constants

const buildFilterQuery = require('./utils/filter-query')

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class TransactionsRepository {
  /**
   * [constructor description]
   * @param  {ConnectionInterface} connection
   * @return {void}
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * [findAll description]
   * @param  {Object}  params
   * @param  {Boolean} count
   * @return {Object}
   */
  findAll (params, count = true) {
    let whereStatement = {}
    let orderBy = []

    const filter = ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId']
    for (const elem of filter) {
      if (params[elem]) { whereStatement[elem] = params[elem] }
    }

    if (params['senderId']) {
      let wallet = this.connection.walletManager.getWalletByAddress([params['senderId']])

      if (wallet) whereStatement['senderPublicKey'] = wallet.publicKey
    }

    params.orderBy
      ? orderBy.push([params.orderBy.split(':')])
      : orderBy.push([['timestamp', 'DESC']])

    return this.connection.models.transaction[count ? 'findAndCountAll' : 'findAll']({
      attributes: ['blockId', 'serialized'],
      where: whereStatement,
      order: orderBy,
      offset: params.offset,
      limit: params.limit,
      include: {
        model: this.connection.models.block,
        attributes: ['height']
      }
    })
  }

  /**
   * [findAllByWallet description]
   * @param  {[type]} wallet
   * @param  {Object} paginator
   * @return {Object}
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
   * @param  {String} senderPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey}, ...paginator})
  }

  /**
   * [findAllByRecipient description]
   * @param  {String} recipientId
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllByRecipient (recipientId, paginator) {
    return this.findAll({...{recipientId}, ...paginator})
  }

  /**
   * [allVotesBySender description]
   * @param  {String} senderPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  allVotesBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey, type: TRANSACTION_TYPES.VOTE}, ...paginator})
  }

  /**
   * [findAllByBlock description]
   * @param  {Number} blockId
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllByBlock (blockId, paginator) {
    return this.findAll({...{blockId}, ...paginator})
  }

  /**
   * [findAllByType description]
   * @param  {Number} type
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllByType (type, paginator) {
    return this.findAll({...{type}, ...paginator})
  }

  /**
   * [findById description]
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.connection.models.transaction.findById(id, {
      include: {
        model: this.connection.models.block,
        attributes: ['height']
      }
    })
  }

  /**
   * [findByTypeAndId description]
   * @param  {Number} type
   * @param  {Number} id
   * @return {Object}
   */
  findByTypeAndId (type, id) {
    return this.connection.models.transaction.findOne({
      where: {id, type},
      include: {
        model: this.connection.models.block,
        attributes: ['height']
      }
    })
  }

  /**
   * [findAllByDateAndType description]
   * @param  {Number} type
   * @param  {Number} from
   * @param  {Number} to
   * @return {Array}
   */
  async findAllByDateAndType (type, from, to) {
    let where = { type, timestamp: {} }

    if (from) where.timestamp[Op.lte] = to
    if (to) where.timestamp[Op.gte] = from
    if (!where.timestamp.length) delete where.timestamp

    const results = await this.connection.models.transaction.findAll({
      attributes: ['serialized'],
      where,
      include: {
        model: this.connection.models.block,
        attributes: ['height']
      }
    })

    return results.map(row => Transaction.deserialize(row.serialized.toString('hex')))
  }

  /**
   * [search description]
   * @param  {Object} payload
   * @return {Object}
   */
  search (payload) {
    let orderBy = []

    payload.orderBy
      ? orderBy.push([payload.orderBy.split(':')])
      : orderBy.push([['timestamp', 'DESC']])

    return this.connection.models.transaction.findAndCountAll({
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
        model: this.connection.models.block,
        attributes: ['height']
      }
    })
  }
}
