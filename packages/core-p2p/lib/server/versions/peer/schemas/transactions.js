const container = require('@arkecosystem/core-container')
const Joi = require('@arkecosystem/crypto').validator.engine.joi

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    transactions: Joi.arkTransactions()
      .min(1)
      .max(
        container.resolveOptions('transactionPool').maxTransactionsPerRequest,
      )
      .options({ stripUnknown: true }),
  },
}

/**
 * @type {Object}
 */
exports.search = {
  payload: {
    transactions: Joi.array().items(Joi.string()),
  },
}
