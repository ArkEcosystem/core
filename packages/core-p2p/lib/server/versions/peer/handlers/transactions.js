const Boom = require('boom')
const pluralize = require('pluralize')

const container = require('@arkecosystem/core-container')
const { TransactionGuard } = require('@arkecosystem/core-transaction-pool')
const { crypto } = require('@arkecosystem/crypto')
const { Transaction } = require('@arkecosystem/crypto').models

const transactionPool = container.resolvePlugin('transactionPool')
const logger = container.resolvePlugin('logger')

const schema = require('../schemas/transactions')

/**
 * @type {Object}
 */
exports.index = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  handler(request, h) {
    return {
      data: [],
    }
  },
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
  async handler(request, h) {
    const { eligible, notEligible } = transactionPool.checkEligibility(
      request.payload.transactions,
    )

    const guard = new TransactionGuard(transactionPool)

    for (const ne of notEligible) {
      guard.invalidate(ne.transaction, ne.reason)
    }

    await guard.validate(eligible)

    if (guard.hasAny('invalid')) {
      return Boom.notAcceptable(
        'Transactions list could not be accepted.',
        guard.errors,
      )
    }

    // TODO: Review throttling of v1
    if (guard.hasAny('accept')) {
      logger.info(
        `Accepted ${pluralize('transaction', guard.accept.length, true)} from ${
          request.payload.transactions.length
        } received`,
      )

      logger.verbose(`Accepted transactions: ${guard.accept.map(tx => tx.id)}`)

      await transactionPool.addTransactions([...guard.accept, ...guard.excess])
    }

    if (!request.payload.isBroadCasted && guard.hasAny('broadcast')) {
      await container
        .resolvePlugin('p2p')
        .broadcastTransactions(guard.broadcast)
    }

    return {
      data: guard.getIds('accept'),
    }
  },
  config: {
    cors: {
      additionalHeaders: ['nethash', 'port', 'version'],
    },
    validate: schema.store,
  },
}

/**
 * @type {Object}
 */
exports.search = {
  /**
   * @param  {Hapi.Request} request
   * @param  {Hapi.Toolkit} h
   * @return {Hapi.Response}
   */
  async handler(request, h) {
    const transactionIds = request.payload.transactions
      .slice(0, 100)
      .filter(id => id.match('[0-9a-fA-F]{32}'))
    const rows = await container
      .resolvePlugin('database')
      .getTransactionsFromIds(transactionIds)

    // TODO: v1 compatibility patch. Add transformer and refactor later on
    const transactions = rows.map(row => {
      const transaction = Transaction.deserialize(
        row.serialized.toString('hex'),
      )
      transaction.blockId = row.block_id
      transaction.senderId = crypto.getAddress(transaction.senderPublicKey)
      return transaction
    })

    transactionIds.forEach((transaction, i) => {
      transactionIds[i] = transactions.find(tx2 => tx2.id === transactionIds[i])
    })

    return { data: transactionIds }
  },
  options: {
    validate: schema.search,
  },
}
