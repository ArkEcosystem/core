'use strict'

const Joi = require('joi')
const pagination = require('./pagination')

/**
 * @type {Object}
 */
exports.index = {
  query: {
    ...pagination,
    ...{
      orderBy: Joi.string(),
      id: Joi.string(),
      version: Joi.number().integer(),
      timestamp: Joi.number().integer(),
      previousBlock: Joi.string(),
      height: Joi.number().integer(),
      numberOfTransactions: Joi.number().integer(),
      totalAmount: Joi.number().integer(),
      totalFee: Joi.number().integer(),
      reward: Joi.number().integer(),
      payloadLength: Joi.number().integer(),
      payloadHash: Joi.string().hex(),
      generatorPublicKey: Joi.string().hex().length(66),
      blockSignature: Joi.string().hex()
    }
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
exports.transactions = {
  params: {
    id: Joi.string()
  },
  query: {
    ...pagination,
    ...{
      orderBy: Joi.string(),
      id: Joi.string().hex().length(66),
      blockId: Joi.string(),
      type: Joi.number().integer(),
      version: Joi.number().integer(),
      senderPublicKey: Joi.string().hex().length(66),
      senderId: Joi.string().alphanum().length(34),
      recipientId: Joi.string().alphanum().length(34),
      timestamp: Joi.number().integer(),
      amount: Joi.number().integer(),
      fee: Joi.number().integer(),
      vendorFieldHex: Joi.string().hex()
    }
  }
}

/**
 * @type {Object}
 */
exports.search = {
  query: pagination,
  payload: {
    id: Joi.string(),
    version: Joi.number().integer(),
    previousBlock: Joi.string(),
    payloadHash: Joi.string().hex(),
    generatorPublicKey: Joi.string().hex().length(66),
    blockSignature: Joi.string().hex(),
    timestamp: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    height: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    numberOfTransactions: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    totalAmount: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    totalFee: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    reward: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    payloadLength: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    })
  }
}
