'use strict'

const { Op } = require('sequelize')
const moment = require('moment')
const { slots } = require('@arkecosystem/crypto')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')

module.exports = class TransactionsRepository extends Repository {
  /**
   * Create a new transaction repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    super(connection)

    // Used to store the height of the block
    this.cache = connection.cache
  }

  /**
   * Get all transactions.
   * @param  {Object}  params
   * @return {Object}
   */
  async findAll (params = {}) {
    const conditions = this.__formatConditions(params)

    if (params.senderId) {
      const senderPublicKey = this.__publicKeyfromSenderId(params.senderId)
      if (senderPublicKey) {
        conditions.senderPublicKey = senderPublicKey
      }
    }

    const orderBy = this.__orderBy(params)

    const buildQuery = query => {
      query = query.from('transactions')

      for (let [key, value] of Object.entries(conditions)) {
        query = query.where(key, value)
      }

      return query
    }

    let rows = []
    // const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    // if (count) {
      const selectQuery = buildQuery(this.query.select('blockId', 'serialized'))
      const transactions = await this.__runQuery(selectQuery, {
        limit: params.limit,
        offset: params.offset,
        orderBy
      })

      rows = await this.__mapBlocksToTransactions(transactions)
    // }

    return { rows, count: rows.length }
  }

  /**
   * Get all transactions (LEGACY, for V1 only).
   * @param  {Object}  params
   * @return {Object}
   */
  async findAllLegacy (params = {}) {
    const conditions = this.__formatConditionsV1(params)

    if (params.senderId) {
      const senderPublicKey = this.__publicKeyfromSenderId(params.senderId)
      if (senderPublicKey) {
        conditions.senderPublicKey = senderPublicKey
      }
    }

    const orderBy = this.__orderBy(params)

    const buildQuery = query => {
      query = query.from('transactions')

      const parts = Object.entries(conditions)
      if (parts.length) {
        const first = parts.shift()
        query = query.where(first[0], first[1])

        for (let [key, value] of parts) {
          query = query.orWhere(key, value)
        }
      }

      return query
    }

    let rows = []
    const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    if (count) {
      const selectQuery = buildQuery(this.query.select('blockId', 'serialized'))
      const transactions = await this.__runQuery(selectQuery, {
        limit: params.limit,
        offset: params.offset,
        orderBy
      })

      rows = await this.__mapBlocksToTransactions(transactions)
    }

    return { rows, count }
  }

  __publicKeyfromSenderId (senderId) {
    const wallet = this.connection.walletManager.getWalletByAddress(senderId)
    return wallet.publicKey
  }

  __orderBy (params) {
    return params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']
  }

  /**
   * Get all transactions for the given Wallet object.
   * @param  {Wallet} wallet
   * @param  {Object} params
   * @return {Object}
   */
  async findAllByWallet (wallet, params = {}) {
    const orderBy = this.__orderBy(params)

    const buildQuery = query => {
      return query
        .from('transactions')
        .where('senderPublicKey', wallet.publicKey)
        .orWhere('recipientId', wallet.address)
    }

    let rows = []
    const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    if (count) {
      const query = buildQuery(this.query.select('blockId', 'serialized'))
      const transactions = await this.__runQuery(query, {
        limit: params.limit,
        offset: params.offset,
        orderBy
      })

      rows = await this.__mapBlocksToTransactions(transactions)
    }

    return { rows, count }
  }

  /**
   * Get all transactions for the given sender public key.
   * @param  {String} senderPublicKey
   * @param  {Object} params
   * @return {Object}
   */
  async findAllBySender (senderPublicKey, params = {}) {
    return this.findAll({...{senderPublicKey}, ...params})
  }

  /**
   * Get all transactions for the given recipient address.
   * @param  {String} recipientId
   * @param  {Object} params
   * @return {Object}
   */
  async findAllByRecipient (recipientId, params = {}) {
    return this.findAll({...{recipientId}, ...params})
  }

  /**
   * Get all vote transactions for the given sender public key.
   * TODO rename to findAllVotesBySender or not?
   * @param  {String} senderPublicKey
   * @param  {Object} params
   * @return {Object}
   */
  async allVotesBySender (senderPublicKey, params = {}) {
    return this.findAll({...{senderPublicKey, type: TRANSACTION_TYPES.VOTE}, ...params})
  }

  /**
   * Get all transactions for the given block.
   * @param  {Number} blockId
   * @param  {Object} params
   * @return {Object}
   */
  async findAllByBlock (blockId, params = {}) {
    return this.findAll({...{blockId}, ...params})
  }

  /**
   * Get all transactions for the given type.
   * @param  {Number} type
   * @param  {Object} params
   * @return {Object}
   */
  async findAllByType (type, params = {}) {
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
  async findById (id) {
    return this.findOne({ id })
  }

  /**
   * Get a transactions for the given type and id.
   * @param  {Number} type
   * @param  {Number} id
   * @return {Object}
   */
  async findByTypeAndId (type, id) {
    return this.findOne({ id, type })
  }

  /**
   * Search all transactions.
   * @param  {Object} payload
   * @return {Object}
   */
  async search (params) {
    const orderBy = this.__orderBy(params)

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

    let rows = []
    const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    if (count) {
      const query = await buildQuery(this.query.select('blockId', 'serialized'))
      const transactions = await this.__runQuery(query, {
        limit: params.limit,
        offset: params.offset,
        orderBy
      })

      rows = await this.__mapBlocksToTransactions(transactions)
    }

    return { rows, count }
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
  async count () {
    return super.__count('transactions')
  }

  /**
   * Calculates min, max and average fee statistics based on transactions table
   * @return {Object}
   */
  async getFeeStatistics () {
    return this
      .connection
      .query
      .select('type')
      .min('fee', 'minFee')
      .max('fee', 'maxFee')
      .avg('fee', 'avgFee')
      .max('timestamp', 'timestamp')
      .from('transactions')
      .where('timestamp', '>=', slots.getTime(moment().subtract(30, 'days')))
      .groupBy('type')
      .orderBy('timestamp', 'DESC')
      .all()
  }

  /**
   * Format any raw conditions.
   * TODO if condition is invalid, raise an Error
   * @param  {Object} params
   * @return {Object}
   */
  __formatConditions (params) {
    const filter = args => {
      return args.filter(elem => ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId'].includes(elem))
    }

    const statement = filter(Object.keys(params)).reduce((all, column) => {
      all[column] = params[column]
      return all
    }, {})

    // NOTE: This could be used to produce complex queries, but currently isn't used
    ;[Op.or, Op.and].map(elem => {
      if (!params[elem]) {
        return
      }

      const fields = Object.assign({}, ...params[elem])

      statement[elem] = filter(Object.keys(fields)).reduce((all, value) => {
        return all.concat({ [value]: fields[value] })
      }, [])
    })

    return statement
  }

  /**
   * Format any raw conditions.
   * TODO if condition is invalid, raise an Error
   * @param  {Object} params
   * @return {Object}
   */
  __formatConditionsV1 (params) {
    const filter = args => {
      return args.filter(elem => ['type', 'senderPublicKey', 'recipientId', 'amount', 'fee', 'blockId'].includes(elem))
    }

    return filter(Object.keys(params)).reduce((all, column) => {
      all[column] = params[column]
      return all
    }, {})
  }

  /**
   * [__mapBlocksToTransactions description]
   * @param  {Array|Object} data
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
          if (block) {
            data[missing.index].block = block
            this.__setBlockCache(block)
          }
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
        data.block = await this.query
          .select('id', 'height')
          .from('blocks')
          .where('id', data.blockId)
          .first()

        this.__setBlockCache(data.block)
      }
    }

    return data
  }

  /**
   * Tries to retrieve the height of the block from the cache
   * @param  {String} blockId
   * @return {Object|null}
   */
  async __getBlockCache (blockId) {
    const height = await this.cache.get(`heights:${blockId}`)
    return height ? ({ height }) : null
  }

  /**
   * Stores the height of the block on the cache
   * @param  {Object} block
   * @param  {String} block.id
   * @param  {Number} block.height
   */
  __setBlockCache ({ id, height }) {
    this.cache.set(`heights:${id}`, { height })
  }
}
