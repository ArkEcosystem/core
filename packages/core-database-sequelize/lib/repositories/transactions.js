'use strict'

const { Op, fn, col } = require('sequelize')
const moment = require('moment')
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
    this.query = connection.query
  }

  /**
   * Get all transactions.
   * @param  {Object}  params
   * @return {Object}
   */
  async findAll (params = {}) {
    const whereStatement = this.__formatConditions(params)

    if (params['senderId']) {
      const wallet = this.connection.walletManager.getWalletByAddress([params['senderId']])

      if (wallet) {
        whereStatement['senderPublicKey'] = wallet.publicKey
      }
    }

    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']

    const buildQuery = (query) => {
      return query
        .from('transactions')
        .whereKeyValuePairs(whereStatement)
    }

    let transactions = await buildQuery(this.query.select(['blockId', 'serialized']))
      .sortBy(orderBy[0], orderBy[1])
      .take(params.limit)
      .skip(params.offset)
      .all()

    let count = await buildQuery(this.query.select('COUNT(DISTINCT id) as count')).first()

    return {
      rows: await this.__mapBlocksToTransactions(transactions),
      count: count.count
    }
  }

  /**
   * Get all transactions for the given Wallet object.
   * @param  {Wallet} wallet
   * @param  {Object} params
   * @return {Object}
   */
  async findAllByWallet (wallet, params) {
    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']

    const buildQuery = (query) => {
      return query
        .from('transactions')
        .where('senderPublicKey', wallet.publicKey)
        .orWhere('recipientId', wallet.address)
    }

    let transactions = await buildQuery(this.query.select(['blockId', 'serialized']))
      .sortBy(orderBy[0], orderBy[1])
      .take(params.limit)
      .skip(params.offset)
      .all()

    let count = await buildQuery(this.query.select('COUNT(DISTINCT id) as count')).first()

    return {
      rows: await this.__mapBlocksToTransactions(transactions),
      count: count.count
    }
  }

  /**
   * Get all transactions for the given sender public key.
   * @param  {String} senderPublicKey
   * @param  {Object} params
   * @return {Object}
   */
  findAllBySender (senderPublicKey, params) {
    return this.findAll({...{senderPublicKey}, ...params})
  }

  /**
   * Get all transactions for the given recipient address.
   * @param  {String} recipientId
   * @param  {Object} params
   * @return {Object}
   */
  findAllByRecipient (recipientId, params) {
    return this.findAll({...{recipientId}, ...params})
  }

  /**
   * Get all vote transactions for the given sender public key.
   * @param  {String} senderPublicKey
   * @param  {Object} params
   * @return {Object}
   */
  allVotesBySender (senderPublicKey, params) {
    return this.findAll({...{senderPublicKey, type: TRANSACTION_TYPES.VOTE}, ...params})
  }

  /**
   * Get all transactions for the given block.
   * @param  {Number} blockId
   * @param  {Object} params
   * @return {Object}
   */
  findAllByBlock (blockId, params) {
    return this.findAll({...{blockId}, ...params})
  }

  /**
   * Get all transactions for the given type.
   * @param  {Number} type
   * @param  {Object} params
   * @return {Object}
   */
  findAllByType (type, params) {
    return this.findAll({...{type}, ...params})
  }

  /**
   * Get a transaction.
   * @param  {Object} conditions
   * @return {Object}
   */
  async findOne (conditions) {
    const transaction = await this.query
      .select(['blockId', 'serialized'])
      .from('transactions')
      .whereKeyValuePairs(conditions)
      .first()

    return this.__mapBlocksToTransactions(transaction)
  }

  /**
   * Get a transaction.
   * @param  {Number} id
   * @return {Object}
   */
  findById (id) {
    return this.findOne({ id })
  }

  /**
   * Get a transactions for the given type and id.
   * @param  {Number} type
   * @param  {Number} id
   * @return {Object}
   */
  findByTypeAndId (type, id) {
    return this.findOne({ id, type })
  }

  /**
   * Search all transactions.
   * @param  {Object} payload
   * @return {Object}
   */
  async search (params) {
    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']

    const conditions = buildFilterQuery(params, {
      exact: ['id', 'blockId', 'type', 'version', 'senderPublicKey', 'recipientId'],
      between: ['timestamp', 'amount', 'fee'],
      wildcard: ['vendorFieldHex']
    })

    const buildQuery = (query) => {
      return query
        .from('transactions')
        .whereStruct(conditions)
    }

    let transactions = await buildQuery(this.query.select(['blockId', 'serialized']))
      .sortBy(orderBy[0], orderBy[1])
      .take(params.limit)
      .skip(params.offset)
      .all()

    let count = await buildQuery(this.query.select('COUNT(DISTINCT id) as count')).first()

    return {
      rows: await this.__mapBlocksToTransactions(transactions),
      count: count.count
    }
  }

  /**
   * Get all transactions that have a vendor field.
   * @return {Object}
   */
  async findWithVendorField () {
    let transactions = await this.query
      .select(['blockId', 'serialized'])
      .from('transactions')
      .whereNotNull('vendorFieldHex')
      .all()

    return this.__mapBlocksToTransactions(transactions)
  }

  /**
   * Count all transactions.
   * @return {Number}
   */
  count () {
    return this
      .connection
      .query
      .select('COUNT(DISTINCT id) as count')
      .from('transactions')
      .first()
  }

  /**
   * Calculates min, max and average fee statistics based on transactions table
   * @return {Object}
   */
  getFeeStatistics () {
    return this.connection.models.transaction.findAll({
      attributes: [
        'type',
        [fn('MAX', col('fee')), 'maxFee'],
        [fn('MIN', col('fee')), 'minFee']
      ],
      where: {
        timestamp: {
          [Op.gte]: slots.getTime(moment().subtract(30, 'days'))
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

  /**
   * [__mapBlocksToTransactions description]
   * @param  {Object} data
   * @return {Object}
   */
  async __mapBlocksToTransactions (data) {
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length - 1; i++) {
        try {
          data[i].block = await this.__getBlockForTransaction(data[i])
        } catch (error) {
          console.log(error)
        }
      }

      return data
    }

    if (data) {
      data.block = await this.__getBlockForTransaction(data)
    }

    return data
  }

  /**
   * [__getBlockForTransaction description]
   * @param  {Object} transaction
   * @return {Object}
   */
  __getBlockForTransaction (transaction) {
    return this.query
      .select('height')
      .from('blocks')
      .where('id', transaction.blockId)
      .first()
  }
}
