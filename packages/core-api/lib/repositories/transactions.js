'use strict'

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')

// const moment = require('moment')
// const { slots } = require('@arkecosystem/crypto')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
// const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')

class TransactionsRepository extends Repository {
  constructor () {
    super()

    this.model = database.models.transaction
    this.query = this.model.query()
  }

  /**
   * Get all transactions.
   * @param  {Object}  params
   * @return {Object}
   */
  async findAll (parameters = {}) {
    const query = this.query
      .select()
      .from(this.query)

    if (parameters.senderId) {
      const senderPublicKey = this.__publicKeyFromSenderId(parameters.senderId)

      if (!senderPublicKey) {
        return { rows: [], count: 0 }
      }

      parameters.senderPublicKey = senderPublicKey
    }

    for (let [key, value] of super.__formatConditions(parameters)) {
      query.where(this.query[key].equals(value))
    }

    return this.__findManyWithCount(query, {
      limit: parameters.limit,
      offset: parameters.offset,
      orderBy: this.__orderBy(parameters)
    })
  }

  /**
   * Get all transactions (LEGACY, for V1 only).
   * @param  {Object}  params
   * @return {Object}
   */
  async findAllLegacy (parameters = {}) {
    // if (parameters.senderId) {
    //   parameters.senderPublicKey = this.__publicKeyFromSenderId(parameters.senderId)
    // }

    // const conditions = super.__formatConditions(parameters)

    // const orderBy = this.__orderBy(parameters)

    // const buildQuery = query => {
    //   query = query.from('transactions')

    //   const parts = super.__formatConditions(parameters)
    //   if (parts.length) {
    //     const first = parts.shift()
    //     query = query.where(first[0], first[1])

    //     for (let [key, value] of parts) {
    //       query = query.orWhere(key, value)
    //     }
    //   }

    //   return query
    // }

    // let rows = []
    // const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    // if (count) {
    //   const selectQuery = buildQuery(this.query.select('block_id', 'serialized'))
    //   const transactions = await this.__runQuery(selectQuery, {
    //     limit: params.limit,
    //     offset: params.offset,
    //     orderBy
    //   })

    //   rows = await this.__mapBlocksToTransactions(transactions)
    // }

    // return { rows, count: rows.length }
  }

  /**
   * Get all transactions for the given Wallet object.
   * @param  {Wallet} wallet
   * @param  {Object} params
   * @return {Object}
   */
  async findAllByWallet (wallet, params = {}) {
    // const orderBy = this.__orderBy(params)

    // const buildQuery = query => {
    //   return query
    //     .from('transactions')
    //     .where('sender_public_key', wallet.publicKey)
    //     .orWhere('recipient_id', wallet.address)
    // }

    // let rows = []
    // const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    // if (count) {
    //   const query = buildQuery(this.query.select('block_id', 'serialized'))
    //   const transactions = await this.__runQuery(query, {
    //     limit: params.limit,
    //     offset: params.offset,
    //     orderBy
    //   })

    //   rows = await this.__mapBlocksToTransactions(transactions)
    // }

    // return { rows, count }
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
    const query = this.query
      .select(this.query.block_id, this.query.serialized)
      .from(this.query)
      .where(conditions)

    return this.__find(query)

    // conditions = this.__formatConditions(conditions).conditions
    // const transaction = await this.query
    //   .select('block_id', 'serialized')
    //   .from('transactions')
    //   .where(conditions)
    //   .first()

    // return this.__mapBlocksToTransactions(transaction)
  }

  /**
   * Get a transaction.
   * @param  {Number} id
   * @return {Object}
   */
  async findById (id) {
    return this.findOne(this.query.id.equals(id))
  }

  /**
   * Get a transactions for the given type and id.
   * @param  {Number} type
   * @param  {Number} id
   * @return {Object}
   */
  async findByTypeAndId (type, id) {
    return this.findOne([
      this.query.id.equals(id), this.query.type.equals(type)
    ])
  }

  /**
   * Get transactions for the given ids.
   * @param  {Array} ids
   * @return {Object}
   */
  async findByIds (ids) {
    // return this
    //   .connection
    //   .query
    //   .select('block_id', 'serialized')
    //   .from('transactions')
    //   .whereIn('id', ids)
    //   .all()
  }

  /**
   * Search all transactions.
   *
   * @param  {Object} params
   * @return {Object}
   */
  async search (params) {
    // const orderBy = this.__orderBy(params)

    // if (params.senderId) {
    //   const senderPublicKey = this.__publicKeyFromSenderId(params.senderId)

    //   if (senderPublicKey) {
    //     params.senderPublicKey = senderPublicKey
    //   }
    // }

    // let { conditions } = this.__formatConditions(params)
    // conditions = buildFilterQuery(conditions, {
    //   exact: ['id', 'block_id', 'type', 'version', 'sender_public_key', 'recipient_id'],
    //   between: ['timestamp', 'amount', 'fee'],
    //   wildcard: ['vendor_field_hex']
    // })

    // const buildQuery = query => {
    //   query = query.from('transactions')

    //   conditions.forEach(condition => {
    //     query = query.where(condition.column, condition.operator, condition.value)
    //   })

    //   return query
    // }

    // let rows = []
    // const { count } = await buildQuery(this.query.select().countDistinct('id', 'count')).first()

    // if (count) {
    //   const query = await buildQuery(this.query.select('block_id', 'serialized'))
    //   const transactions = await this.__runQuery(query, {
    //     limit: params.limit,
    //     offset: params.offset,
    //     orderBy
    //   })

    //   rows = await this.__mapBlocksToTransactions(transactions)
    // }

    // return { rows, count }
  }

  /**
   * Get all transactions that have a vendor field.
   * @return {Object}
   */
  async findWithVendorField () {
    // const transactions = await this.query
    //   .select('block_id', 'serialized')
    //   .from('transactions')
    //   .whereNotNull('vendor_field_hex')
    //   .all()

    // return this.__mapBlocksToTransactions(transactions)
  }

  /**
   * Calculates min, max and average fee statistics based on transactions table
   * @return {Object}
   */
  async getFeeStatistics () {
    // return this
    //   .connection
    //   .query
    //   .select('type')
    //   .min('fee', 'minFee')
    //   .max('fee', 'maxFee')
    //   .avg('fee', 'avgFee')
    //   .max('timestamp', 'timestamp')
    //   .from('transactions')
    //   .where('timestamp', '>=', slots.getTime(moment().subtract(30, 'days')))
    //   .groupBy('type')
    //   .orderBy('timestamp', 'DESC')
    //   .all()
  }

  /**
   * [__mapBlocksToTransactions description]
   * @param  {Array|Object} data
   * @return {Object}
   */
  async __mapBlocksToTransactions (data) {
    // // Array...
    // if (Array.isArray(data)) {
    //   // 1. get heights from cache
    //   const missingFromCache = []

    //   for (let i = 0; i < data.length; i++) {
    //     const cachedBlock = await this.__getBlockCache(data[i].blockId)

    //     if (cachedBlock) {
    //       data[i].block = cachedBlock
    //     } else {
    //       missingFromCache.push({
    //         index: i,
    //         blockId: data[i].blockId
    //       })
    //     }
    //   }

    //   // 2. get missing heights from database
    //   if (missingFromCache.length) {
    //     const blocks = await this.query
    //       .select('id', 'height')
    //       .from('blocks')
    //       .whereIn('id', missingFromCache.map(d => d.blockId))
    //       .groupBy('id')
    //       .all()

    //     for (let i = 0; i < missingFromCache.length; i++) {
    //       const missing = missingFromCache[i]
    //       const block = blocks.find(block => (block.id === missing.blockId))
    //       if (block) {
    //         data[missing.index].block = block
    //         this.__setBlockCache(block)
    //       }
    //     }
    //   }

    //   return data
    // }

    // // Object...
    // if (data) {
    //   const cachedBlock = await this.__getBlockCache(data.blockId)

    //   if (cachedBlock) {
    //     data.block = cachedBlock
    //   } else {
    //     data.block = await this.query
    //       .select('id', 'height')
    //       .from('blocks')
    //       .where('id', data.blockId)
    //       .first()

    //     this.__setBlockCache(data.block)
    //   }
    // }

    // return data
  }

  /**
   * Tries to retrieve the height of the block from the cache
   * @param  {String} blockId
   * @return {Object|null}
   */
  async __getBlockCache (blockId) {
    // const height = await this.cache.get(`heights:${blockId}`)
    // return height ? ({ height, id: blockId }) : null
  }

  /**
   * Stores the height of the block on the cache
   * @param  {Object} block
   * @param  {String} block.id
   * @param  {Number} block.height
   */
  __setBlockCache ({ id, height }) {
    // this.cache.set(`heights:${id}`, height)
  }

  /**
   * Retrieves the publicKey of the address from the WalletManager in-memory data
   * @param {String} senderId
   * @return {String}
   */
  __publicKeyFromSenderId (senderId) {
    return database.walletManager.findByAddress(senderId).publicKey
  }

  __orderBy (parameters) {
    return parameters.orderBy
      ? parameters.orderBy.split(':')
      : ['timestamp', 'desc']
  }
}

module.exports = new TransactionsRepository()
