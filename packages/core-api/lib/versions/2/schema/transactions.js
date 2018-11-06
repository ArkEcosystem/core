'use strict'

const Joi = require('joi')
const pagination = require('./pagination')

const container = require('@arkecosystem/core-container')

/**
 * @type {Object}
 */
exports.index = {
  query: {
    ...pagination,
    ...{
      orderBy: Joi.string(),
      id: Joi.string().hex().length(64),
      blockId: Joi.string(),
      type: Joi.number().integer().min(0),
      version: Joi.number().integer().positive(),
      senderPublicKey: Joi.string().hex().length(66),
      senderId: Joi.string().alphanum().length(34),
      recipientId: Joi.string().alphanum().length(34),
      ownerId: Joi.string().alphanum().length(34),
      timestamp: Joi.number().integer().min(0),
      amount: Joi.number().integer().min(0),
      fee: Joi.number().integer().min(0),
      vendorFieldHex: Joi.string().hex()
    }
  }
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
    orderBy: Joi.string(),
    id: Joi.string().hex().length(64),
    blockId: Joi.string(),
    type: Joi.number().integer().min(0),
    version: Joi.number().integer().positive(),
    senderPublicKey: Joi.string().hex().length(66),
    senderId: Joi.string().alphanum().length(34),
    recipientId: Joi.string().alphanum().length(34),
    ownerId: Joi.string().alphanum().length(34),
    vendorFieldHex: Joi.string().hex(),
    timestamp: Joi.object().keys({
      from: Joi.number().integer().min(0),
      to: Joi.number().integer().min(0)
    }),
    amount: Joi.object().keys({
      from: Joi.number().integer().min(0),
      to: Joi.number().integer().min(0)
    }),
    fee: Joi.object().keys({
      from: Joi.number().integer().min(0),
      to: Joi.number().integer().min(0)
    })
  }
}
