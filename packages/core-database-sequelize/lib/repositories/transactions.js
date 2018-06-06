'use strict'

const { Op } = require('sequelize')
const moment = require('moment')
const { slots } = require('@arkecosystem/crypto')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')
const Cache = require('../cache')

module.exports = class TransactionsRepository extends Repository {
  /**
   * Create a new transaction repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    super(connection)

    this.cache = new Cache()
  }

  /**
   * Get all transactions.
   * @param  {Object}  params
   * @return {Object}
   */
  async findAll (params = {}) {
    const conditions = this.__formatConditions(params)

    if (params['senderId']) {
      const wallet = this.connection.walletManager.getWalletByAddress([params['senderId']])

      if (wallet) {
        conditions['senderPublicKey'] = wallet.publicKey
      }
    }

    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']

    const buildQuery = query => {
      query = query.from('transactions')

      for (let [key, value] of Object.entries(conditions)) {
        query = query.where(key, value)
      }

      return query
    }

    const query = buildQuery(this.query.select('blockId', 'serialized'))
    const transactions = await this.__runQuery(query, {
      limit: params.limit,
      offset: params.offset,
      orderBy
    })

    // const { count } = await buildQuery(this.query.countDistinct('id', 'count')).first()

    return {
      rows: await this.__mapBlocksToTransactions(transactions),
      count: transactions.length
      // count
    }
  }

  /**
   * Get all transactions for the given Wallet object.
   * @param  {Wallet} wallet
   * @param  {Object} params
   * @return {Object}
   */
  async findAllByWallet (wallet, params = {}) {
    const orderBy = params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']

    const buildQuery = query => {
      return query
        .from('transactions')
        .where('senderPublicKey', wallet.publicKey)
        .orWhere('recipientId', wallet.address)
    }

    const query = buildQuery(this.query.select('blockId', 'serialized'))
    const transactions = await this.__runQuery(query, {
      limit: params.limit,
      offset: params.offset,
      orderBy
    })

    const { count } = await buildQuery(this.query.countDistinct('id', 'count')).first()

    return {
      rows: await this.__mapBlocksToTransactions(transactions),
      count
    }
  }

  /**
   * Get all transactions for the given sender public key.
   * @param  {String} senderPublicKey
   * @param  {Object} params
   * @return {Object}
   */
  findAllBySender (senderPublicKey, params = {}) {
    return this.findAll({...{senderPublicKey}, ...params})
  }

  /**
   * Get all transactions for the given recipient address.
   * @param  {String} recipientId
   * @param  {Object} params
   * @return {Object}
   */
  findAllByRecipient (recipientId, params = {}) {
    return this.findAll({...{recipientId}, ...params})
  }

  /**
   * Get all vote transactions for the given sender public key.
   * TODO rename to findAllVotesBySender or not?
   * @param  {String} senderPublicKey
   * @param  {Object} params
   * @return {Object}
   */
  allVotesBySender (senderPublicKey, params = {}) {
    return this.findAll({...{senderPublicKey, type: TRANSACTION_TYPES.VOTE}, ...params})
  }

  /**
   * Get all transactions for the given block.
   * @param  {Number} blockId
   * @param  {Object} params
   * @return {Object}
   */
  findAllByBlock (blockId, params = {}) {
    return this.findAll({...{blockId}, ...params})
  }

  /**
   * Get all transactions for the given type.
   * @param  {Number} type
   * @param  {Object} params
   * @return {Object}
   */
  findAllByType (type, params = {}) {
    return this.findAll({...{type}, ...params})
  }

  /**
   * Get a transaction.
   * @param  {Object} conditions
   * @return {Object}
   */
  async findOne (conditions) {
    const transaction = await this.query
      .select('blockId', 'serialized')
      .from('transactions')
      .where(conditions)
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

    const buildQuery = query => {
      query = query.from('transactions')

      conditions.forEach(condition => {
        query = query.where(condition.column, condition.operator, condition.value)
      })

      return query
    }

    const query = await buildQuery(this.query.select('blockId', 'serialized'))
    const transactions = await this.__runQuery(query, {
      limit: params.limit,
      offset: params.offset,
      orderBy
    })

    const { count } = await buildQuery(this.query.countDistinct('id', 'count')).first()

    return {
      rows: await this.__mapBlocksToTransactions(transactions),
      count
    }
  }

  /**
   * Get all transactions that have a vendor field.
   * @return {Object}
   */
  async findWithVendorField () {
    const transactions = await this.query
      .select('blockId', 'serialized')
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
    return super.__count('transactions')
  }

  /**
   * Calculates min, max and average fee statistics based on transactions table
   * @return {Object}
   */
  getFeeStatistics () {
    return this
      .connection
      .query
      .select('type')
      .min('fee', 'minFee')
      .max('fee', 'maxFee')
      .max('timestamp', 'timestamp')
      .from('transactions')
      .where('timestamp', '>=', slots.getTime(moment().subtract(30, 'days')))
      .groupBy('type')
      .orderBy('timestamp', 'DESC')
      .all()
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
    // Array...
    if (Array.isArray(data)) {
      // 1. get heights from cache
      const missingFromCache = []

      for (let i = 0; i < data.length; i++) {
        const cachedBlock = await this.__getBlockCache(data[i].blockId)

        if (cachedBlock) {
          data[i].block = cachedBlock
        } else {
          missingFromCache.push({
            index: i,
            blockId: data[i].blockId
          })
        }
      }

      // 2. get missing heights from database
      if (missingFromCache.length) {
        const blocks = await this.query
          .select('id', 'height')
          .from('blocks')
          .whereIn('id', missingFromCache.map(d => d.blockId))
          .groupBy('id')
          .all()

        for (let i = 0; i < missingFromCache.length; i++) {
          const missing = missingFromCache[i]
          const block = blocks.find(block => (block.id === missing.blockId))

          data[missing.index].block = block

          this.__setBlockCache(block)
        }
      }

      return data
    }

    // Object...
    if (data) {
      const cachedBlock = await this.__getBlockCache(data.blockId)

      if (cachedBlock) {
        data.block = cachedBlock
      } else {
        const block = await this.query
          .select('id', 'height')
          .from('blocks')
          .where('id', data.blockId)
          .first()

        this.__setBlockCache(block)
      }
    }

    return data
  }

  /**
   * [__getBlockCache description]
   * @param  {[type]} blockId [description]
   * @return {[type]}         [description]
   */
  async __getBlockCache (blockId) {
    const cachedHeight = await this.cache.get(`heights:${blockId}`)

    if (cachedHeight) {
      return { height: cachedHeight }
    }

    return false
  }

  /**
   * [__setBlockCache description]
   * @param  {[type]} block [description]
   * @return {[type]}       [description]
   */
  __setBlockCache (block) {
    this.cache.set(`heights:${block.id}`, block.height)
  }
}
