'use strict'

const Joi = require('joi')

/**
 * @type {Object}
 */
exports.index = {
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    transactions: Joi.array().items(Joi.object())
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
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
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
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  },
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
