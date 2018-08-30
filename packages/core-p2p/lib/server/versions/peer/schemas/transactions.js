'use strict'

const Joi = require('joi')
const container = require('@arkecosystem/core-container')

/**
 * @type {Object}
 */
exports.index = {
  query: {
    os: Joi.string(),
    status: Joi.string(),
    port: Joi.number().integer(),
    version: Joi.string(),
    orderBy: Joi.string()
  }
}

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
exports.searchByIds = {
  query: {
    ids: Joi.string()
  }
}
