'use strict'

const container = require('@arkecosystem/core-container')
const database = container.resolvePlugin('database')

const moment = require('moment')
const { slots } = require('@arkecosystem/crypto')
const { TRANSACTION_TYPES } = require('@arkecosystem/crypto').constants
const buildFilterQuery = require('./utils/filter-query')
const Repository = require('./repository')

class TransactionsRepository extends Repository {
  getModel () {
    return database.models.transaction
  }

  /**
   * Get all transactions.
   * @param  {Object}  params
   * @return {Object}
   */
  async findAll (parameters = {}) {
    const selectQuery = this.query.select().from(this.query)
    const countQuery = this._makeEstimateQuery()

    if (parameters.senderId) {
      const senderPublicKey = this.__publicKeyFromSenderId(parameters.senderId)

      if (!senderPublicKey) {
        return { rows: [], count: 0 }
      }

      parameters.senderPublicKey = senderPublicKey
    }

    const applyConditions = queries => {
      const conditions = Object.entries(this._formatConditions(parameters))

      if (conditions.length) {
        const first = conditions.shift()

        for (const item of queries) {
          item.where(this.query[first[0]].equals(first[1]))

          for (const condition of conditions) {
            item.and(this.query[condition[0]].equals(condition[1]))
          }
        }
      }
    }

    applyConditions([selectQuery, countQuery])

    return this._findManyWithCount(selectQuery, countQuery, {
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
    const selectQuery = this.query
      .select(this.query.block_id, this.query.serialized)
      .from(this.query)
    const countQuery = this._makeEstimateQuery()

    if (parameters.senderId) {
      parameters.senderPublicKey = this.__publicKeyFromSenderId(parameters.senderId)
    }

    const applyConditions = queries => {
      const conditions = Object.entries(this._formatConditions(parameters))

      if (conditions.length) {
        const first = conditions.shift()

        for (const item of queries) {
          item.where(this.query[first[0]].equals(first[1]))

          for (const [key, value] of conditions) {
            item.or(this.query[key].equals(value))
          }
        }
      }
    }

    applyConditions([selectQuery, countQuery])

    // rows = await this.__mapBlocksToTransactions(transactions)

    return this._findManyWithCount(selectQuery, countQuery, {
      limit: parameters.limit,
      offset: parameters.offset,
      orderBy: this.__orderBy(parameters)
    })
  }

  /**
   * Get all transactions for the given Wallet object.
   * @param  {Wallet} wallet
   * @param  {Object} parameters
   * @return {Object}
   */
  async findAllByWallet (wallet, parameters = {}) {
    const selectQuery = this.query
      .select(this.query.block_id, this.query.serialized)
      .from(this.query)
    const countQuery = this._makeEstimateQuery()

    const applyConditions = queries => {
      for (const item of queries) {
        item
          .where(this.query.sender_public_key.equals(wallet.publicKey))
          .or(this.query.recipient_id.equals(wallet.address))
      }
    }

    applyConditions([selectQuery, countQuery])

    // rows = await this.__mapBlocksToTransactions(transactions)

    return this._findManyWithCount(selectQuery, countQuery, {
      limit: parameters.limit,
      offset: parameters.offset,
      orderBy: this.__orderBy(parameters)
    })
  }

  /**
   * Get all transactions for the given sender public key.
   * @param  {String} senderPublicKey
   * @param  {Object} parameters
   * @return {Object}
   */
  async findAllBySender (senderPublicKey, parameters = {}) {
    return this.findAll({...{senderPublicKey}, ...parameters})
  }

  /**
   * Get all transactions for the given recipient address.
   * @param  {String} recipientId
   * @param  {Object} parameters
   * @return {Object}
   */
  async findAllByRecipient (recipientId, parameters = {}) {
    return this.findAll({...{recipientId}, ...parameters})
  }

  /**
   * Get all vote transactions for the given sender public key.
   * TODO rename to findAllVotesBySender or not?
   * @param  {String} senderPublicKey
   * @param  {Object} parameters
   * @return {Object}
   */
  async allVotesBySender (senderPublicKey, parameters = {}) {
    return this.findAll({...{senderPublicKey, type: TRANSACTION_TYPES.VOTE}, ...parameters})
  }

  /**
   * Get all transactions for the given block.
   * @param  {Number} blockId
   * @param  {Object} parameters
   * @return {Object}
   */
  async findAllByBlock (blockId, parameters = {}) {
    return this.findAll({...{blockId}, ...parameters})
  }

  /**
   * Get all transactions for the given type.
   * @param  {Number} type
   * @param  {Object} parameters
   * @return {Object}
   */
  async findAllByType (type, parameters = {}) {
    return this.findAll({...{type}, ...parameters})
  }

  /**
   * Get a transaction.
   * @param  {Number} id
   * @return {Object}
   */
  async findById (id) {
    const query = this.query
      .select(this.query.block_id, this.query.serialized)
      .from(this.query)
      .where(this.query.id.equals(id))

    // return this.__mapBlocksToTransactions(transaction)

    return this._find(query)
  }

  /**
   * Get a transactions for the given type and id.
   * @param  {Number} type
   * @param  {Number} id
   * @return {Object}
   */
  async findByTypeAndId (type, id) {
    const query = this.query
      .select(this.query.block_id, this.query.serialized)
      .from(this.query)
      .where(this.query.id.equals(id).and(this.query.type.equals(type)))

    // return this.__mapBlocksToTransactions(transaction)

    return this._find(query)
  }

  /**
   * Get transactions for the given ids.
   * @param  {Array} ids
   * @return {Object}
   */
  async findByIds (ids) {
    const query = this.query
      .select(this.query.block_id, this.query.serialized)
      .from(this.query)
      .where(this.query.id.in(ids))

    return this._findMany(query)
  }

  /**
   * Get all transactions that have a vendor field.
   * @return {Object}
   */
  async findWithVendorField () {
    const query = this.query
      .select(this.query.block_id, this.query.serialized)
      .from(this.query)
      .where(this.query.vendor_field_hex.isNotNull())

    // return this.__mapBlocksToTransactions(transaction)

    return this._findMany(query)
  }

  /**
   * Calculates min, max and average fee statistics based on transactions table
   * @return {Object}
   */
  async getFeeStatistics () {
    const query = this.query
      .select(
        this.query.type,
        this.query.fee.min('minFee'),
        this.query.fee.max('maxFee'),
        this.query.fee.avg('avgFee'),
        this.query.timestamp.max('timestamp')
      )
      .from(this.query)
      .where(this.query.timestamp.gte(slots.getTime(moment().subtract(30, 'days'))))
      .group(this.query.type)
      .order('"timestamp" DESC')

    return this._findMany(query)
  }

  /**
   * Search all transactions.
   *
   * @param  {Object} params
   * @return {Object}
   */
  async search (parameters) {
    const selectQuery = this.query.select().from(this.query)
    const countQuery = this._makeEstimateQuery()

    if (parameters.senderId) {
      const senderPublicKey = this.__publicKeyFromSenderId(parameters.senderId)

      if (senderPublicKey) {
        parameters.senderPublicKey = senderPublicKey
      }
    }

    const applyConditions = queries => {
      const conditions = buildFilterQuery(this._formatConditions(parameters), {
        exact: ['id', 'block_id', 'type', 'version', 'sender_public_key', 'recipient_id'],
        between: ['timestamp', 'amount', 'fee'],
        wildcard: ['vendor_field_hex']
      })

      if (conditions.length) {
        const first = conditions.shift()

        for (const item of queries) {
          item.where(this.query[first.column][first.method](first.value))

          for (const condition of conditions) {
            item.and(this.query[condition.column][condition.method](condition.value))
          }
        }
      }
    }

    applyConditions([selectQuery, countQuery])

    // rows = await this.__mapBlocksToTransactions(transactions)

    return this._findManyWithCount(selectQuery, countQuery, {
      limit: parameters.limit,
      offset: parameters.offset,
      orderBy: this.__orderBy(parameters)
    })
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
