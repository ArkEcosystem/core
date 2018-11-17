const container = require('@arkecosystem/core-container')
const Joi = require('@arkecosystem/crypto').validator.engine.joi

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    transactions: Joi.array()
      .max(
        container.resolveOptions('transactionPool').maxTransactionsPerRequest,
      )
      .items(
        Joi.alternatives().try(
          Joi.arkTransfer(),
          Joi.arkSecondSignature(),
          Joi.arkDelegateRegistration(),
          Joi.arkVote(),
          Joi.arkMultiSignature(),
        ),
      ),
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
