'use strict'

const Op = require('sequelize').Op
const fn = require('sequelize').fn
const col = require('sequelize').col

const moment = require('moment')

const { Transaction } = require('@arkecosystem/crypto').models
const { slots } = require('@arkecosystem/crypto')

const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants

const buildFilterQuery = require('./utils/filter-query')

module.exports = class TransactionsRepository {
  /**
   * Create a new transaction repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    this.connection = connection
  }

  /**
   * Get all transactions.
   * @param  {Object}  params
   * @param  {Boolean} count
   * @return {Object}
   */
  findAll (params = {}, count = true) {
    const whereStatement = this.__formatConditions(params)
    const orderBy = []

    if (params['senderId']) {
      const wallet = this.connection.walletManager.getWalletByAddress([params['senderId']])

      if (wallet) {
        whereStatement['senderPublicKey'] = wallet.publicKey
      }
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
   * Get all transactions for the given Wallet object.
   * @param  {Wallet} wallet
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
   * Get all transactions for the given sender public key.
   * @param  {String} senderPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey}, ...paginator})
  }

  /**
   * Get all transactions for the given recipient address.
   * @param  {String} recipientId
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllByRecipient (recipientId, paginator) {
    return this.findAll({...{recipientId}, ...paginator})
  }

  /**
   * Get all vote transactions for the given sender public key.
   * @param  {String} senderPublicKey
   * @param  {Object} paginator
   * @return {Object}
   */
  allVotesBySender (senderPublicKey, paginator) {
    return this.findAll({...{senderPublicKey, type: TRANSACTION_TYPES.VOTE}, ...paginator})
  }

  /**
   * Get all transactions for the given block.
   * @param  {Number} blockId
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllByBlock (blockId, paginator) {
    return this.findAll({...{blockId}, ...paginator})
  }

  /**
   * Get all transactions for the given type.
   * @param  {Number} type
   * @param  {Object} paginator
   * @return {Object}
   */
  findAllByType (type, paginator) {
    return this.findAll({...{type}, ...paginator})
  }

  /**
   * Get a transaction.
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
   * Get a transactions for the given type and id.
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
   * Get all transactions for the given type and range.
   * @param  {Number} type
   * @param  {Number} from
   * @param  {Number} to
   * @return {Array}
   */
  async findAllByDateAndType (type, from, to) {
    let where = { type, timestamp: {} }

    if (from) {
      where.timestamp[Op.gte] = from
    }

    if (to) {
      where.timestamp[Op.lte] = to
    }

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
   * Search all transactions.
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

  /**
   * Get all transactions that have a vendor field.
   * @return {Object}
   */
  findWithVendorField () {
    return this.connection.models.transaction.findAll({
      attributes: ['serialized'],
      where: {
        vendorFieldHex: {
          [Op.ne]: null
        }
      }
    })
  }

  /**
   * Count all transactions.
   * @return {Number}
   */
  count () {
    return this.connection.models.transaction.count()
  }

  /**
   * Calculates min, max and average fee statistics based on transactions table
   * @return {Object}
   */
  getFeeStatistics () {
    const timeStampLimit = slots.getTime(moment().subtract(30, 'days'))
    return this.connection.models.transaction.findAll({
    attributes: [
      'type',
      [fn('MAX', col('fee')), 'maxFee'],
      [fn('MIN', col('fee')), 'minFee']
    ],
    where: {
      timestamp: {
        [Op.gte]: timeStampLimit
      }
    },
    group: 'type',
    order: [['timestamp', 'DESC']]
    })
  }

  /**
   * Format any raw conditions.
   * @param  {Object} params
   * @return {Object}
   */
  __formatConditions (params) {
    let statement = {}

    const conditions = [Op.or, Op.and]
    const filter = (args) => args.filter(elem => ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId'].includes(elem))

    filter(Object.keys(params)).map(col => (statement[col] = params[col]))

    conditions.map(elem => {
      if (!params[elem]) {
        return
      }

      const fields = Object.assign({}, ...params[elem])
      statement[elem] = filter(Object.keys(fields)).reduce((prev, val) => prev.concat({ [val]: fields[val] }), [])
    })

    return statement
  }
}
