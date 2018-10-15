'use strict'

const Joi = require('joi')
const pagination = require('./pagination')

const container = require('@arkecosystem/core-container')

/**
 * @type {Object}
 */
exports.index = {
  query: { ...pagination, ...{ orderBy: Joi.string() } }
}

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    transactions: Joi.array().max(container.resolveOptions('transactionPool').maxTransactionsPerRequest).items(Joi.object())
  }
}

/**
 * @type {Object}
 */
exports.show = {
  params: {
    id: Joi.string()
  }
}

/**
 * @type {Object}
 */
exports.unconfirmed = {
  query: pagination
}

/**
 * @type {Object}
 */
exports.showUnconfirmed = {
  params: {
    id: Joi.string()
  }
}

/**
 * @type {Object}
 */
exports.search = {
  query: pagination,
  payload: {
    id: Joi.string(),
    blockId: Joi.string(),
    type: Joi.number().integer(),
    version: Joi.number().integer(),
    senderId: Joi.string(),
    senderPublicKey: Joi.string(),
    recipientId: Joi.string(),
    vendorFieldHex: Joi.string().hex(),
    timestamp: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    amount: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    fee: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    })
  }
}
