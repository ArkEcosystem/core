'use strict'

const { Op } = require('sequelize')
const moment = require('moment')
const { slots } = require('@phantomcore/crypto')
const { TRANSACTION_TYPES } = require('@phantomcore/crypto').constants
const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')

module.exports = class TransactionsRepository extends Repository {
  /**
   * Create a new transaction repository instance.
   * @param  {ConnectionInterface} connection
   */
  constructor (connection) {
    super(connection, 'transaction')

    // Used to store the height of the block
    this.cache = connection.cache
  }

  /**
   * Get all transactions.
   * @param  {Object}  params
   * @return {Object}
   */
  async findAll (params = {}) {
    if (params.senderId) {
      const senderPublicKey = this.__publicKeyfromSenderId(params.senderId)

      if (!senderPublicKey) {
        return { rows: [], count: 0 }
      }
      params.senderPublicKey = senderPublicKey
    }

    const { conditions } = this.__formatConditions(params)

    const orderBy = this.__orderBy(params)

    const buildQuery = query => {
      query = query.from('transactions')

      for (let [key, value] of Object.entries(conditions)) {
        query = query.where(key, value)
      }

      return query
    }

    let rows = []

    // NOTE: The real count is avoided because it degrades the performance of the node
    // const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    // if (count) {
      const selectQuery = buildQuery(this.query.select('block_id', 'serialized'))
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
    if (params.senderId) {
      params.senderPublicKey = this.__publicKeyfromSenderId(params.senderId)
    }

    const conditions = this.__formatConditionsV1(params)

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
    // NOTE: The real count is avoided because it degrades the performance of the node
    // const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    // if (count) {
      const selectQuery = buildQuery(this.query.select('block_id', 'serialized'))
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
        .where('sender_public_key', wallet.publicKey)
        .orWhere('recipient_id', wallet.address)
    }

    let rows = []
    const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    if (count) {
      const query = buildQuery(this.query.select('block_id', 'serialized'))
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
    conditions = this.__formatConditions(conditions).conditions
    const transaction = await this.query
      .select('block_id', 'serialized')
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
   * Get transactions for the given ids.
   * @param  {Array} ids
   * @return {Object}
   */
  async findByIds (ids) {
    return this
      .connection
      .query
      .select('block_id', 'serialized')
      .from('transactions')
      .whereIn('id', ids)
      .all()
  }

  /**
   * Search all transactions.
   *
   * @param  {Object} params
   * @return {Object}
   */
  async search (params) {
    const orderBy = this.__orderBy(params)

    if (params.senderId) {
      const senderPublicKey = this.__publicKeyfromSenderId(params.senderId)

      if (senderPublicKey) {
        params.senderPublicKey = senderPublicKey
      }
    }

    let { conditions } = this.__formatConditions(params)
    conditions = buildFilterQuery(conditions, {
      exact: ['id', 'block_id', 'type', 'version', 'sender_public_key', 'recipient_id'],
      between: ['timestamp', 'amount', 'fee'],
      wildcard: ['vendor_field_hex']
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
      const query = await buildQuery(this.query.select('block_id', 'serialized'))
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
      .select('block_id', 'serialized')
      .from('transactions')
      .whereNotNull('vendor_field_hex')
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
    const { conditions, filter } = super.__formatConditions(params)

    // NOTE: This could be used to produce complex queries, but currently isn't used
    ;[Op.or, Op.and].map(elem => {
      if (!params[elem]) {
        return
      }

      const fields = Object.assign({}, ...params[elem])

      conditions[elem] = filter(Object.keys(fields)).reduce((all, value) => {
        return all.concat({ [value]: fields[value] })
      }, [])
    })

    return { conditions, filter }
  }

  /**
   * Format any raw conditions.
   * TODO if condition is invalid, raise an Error
   * @param  {Object} params
   * @return {Object}
   */
  __formatConditionsV1 (params) {
    return super.__formatConditions(params).conditions
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
    return height ? ({ height, id: blockId }) : null
  }

  /**
   * Stores the height of the block on the cache
   * @param  {Object} block
   * @param  {String} block.id
   * @param  {Number} block.height
   */
  __setBlockCache ({ id, height }) {
    this.cache.set(`heights:${id}`, height)
  }

  /**
   * Retrieves the publicKey of the address from the WalletManager in-memory data
   * @param {String} senderId
   * @return {String}
   */
  __publicKeyfromSenderId (senderId) {
    return this.connection.walletManager.getWalletByAddress(senderId).publicKey
  }

  __orderBy (params) {
    return params.orderBy
      ? params.orderBy.split(':')
      : ['timestamp', 'DESC']
  }
}
