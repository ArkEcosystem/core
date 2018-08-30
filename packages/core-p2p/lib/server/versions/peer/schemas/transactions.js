'use strict'

const Joi = require('joi')
const container = require('@arkecosystem/core-container')

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    transactions: Joi.array().max(container.resolveOptions('transactionPool').maxTransactionsPerRequest)
  }
}

/**
 * @type {Object}
 */
exports.search = {
  query: {
    transactions: Joi.array(Joi.string())
  }
}
