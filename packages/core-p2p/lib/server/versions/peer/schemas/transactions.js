const Joi = require('joi')
const container = require('@arkecosystem/core-container')

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    transactions: Joi.array()
      .max(
        container.resolveOptions('transactionPool').maxTransactionsPerRequest,
      )
      .items(Joi.object()),
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
