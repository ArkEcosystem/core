'use strict'

const container = require('@arkecosystem/core-container')
const { TransactionGuard } = require('@arkecosystem/core-transaction-pool')
const { crypto } = require('@arkecosystem/crypto')
const { Transaction } = require('@arkecosystem/crypto').models

const transactionPool = container.resolvePlugin('transactionPool')
const logger = container.resolvePlugin('logger')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler (request, h) {
    return { transactions: [] }
  }
}

/**
 * @type {Object}
 */
exports.store = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    let error
    if (!request.payload || !request.payload.transactions) {
      error = 'No transactions received'
    } else if (!transactionPool) {
      error = 'Transaction pool not available'
    }

    if (error) {
      return {
        success: false,
        message: error,
        error: error
      }
    }

    if (request.payload.transactions.length > transactionPool.options.maxTransactionsPerRequest) {
      return h.response({
        success: false,
        error: 'Number of transactions is exceeding max payload size per single request.'
      }).code(500)
    }

    /**
     * Here we will make sure we memorize the transactions for future requests
     * and decide which transactions are valid or invalid in order to prevent
     * duplication and race conditions caused by concurrent requests.
     */
    const { valid, invalid } = transactionPool.memory.memorize(request.payload.transactions)

    const guard = new TransactionGuard(transactionPool)
    guard.invalid = invalid
    await guard.validate(valid)

    if (guard.hasAny('invalid')) {
      return {
        success: false,
        message: 'Transactions list is not conform',
        error: 'Transactions list is not conform'
      }
    }

    // TODO: Review throttling of v1
    if (guard.hasAny('accept')) {
      logger.info(`Accepted ${guard.accept.length} transactions from ${request.payload.transactions.length} received`)

      logger.verbose(`Accepted transactions: ${guard.accept.map(tx => tx.id)}`)

      await transactionPool.addTransactions([...guard.accept, ...guard.excess])

      transactionPool.memory
        .forget(guard.getIds('accept'))
        .forget(guard.getIds('excess'))
    }

    if (!request.payload.isBroadCasted && guard.hasAny('broadcast')) {
      await container
        .resolvePlugin('p2p')
        .broadcastTransactions(guard.broadcast)
    }

    return {
      success: true,
      transactionIds: guard.getIds('accept')
    }
  },
  config: {
    cors: {
      additionalHeaders: ['nethash', 'port', 'version']
    }
  }
}

/**
 * @type {Object}
 */
exports.searchByIds = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler (request, h) {
    const transactionIds = request.query.ids.split(',').slice(0, 100).filter(id => id.match('[0-9a-fA-F]{32}'))
    const rows = await container.resolvePlugin('database').getTransactionsFromIds(transactionIds)

    // TODO: v1 compatibility patch. Add transformer and refactor later on
    const transactions = await rows.map(row => {
      let transaction = Transaction.deserialize(row.serialized.toString('hex'))
      transaction.blockId = row.block_id
      transaction.senderId = crypto.getAddress(transaction.senderPublicKey)
      return transaction
    })

    const returnTrx = transactionIds.map((transaction, i) => (transactionIds[i] = transactions.find(tx2 => tx2.id === transactionIds[i])))

    return { success: true, transactions: returnTrx }
  }
}
