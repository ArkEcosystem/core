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
      version: Joi.number().integer().positive(),
      timestamp: Joi.number().integer().positive(),
      previousBlock: Joi.string(),
      height: Joi.number().integer().positive(),
      numberOfTransactions: Joi.number().integer().positive(),
      totalAmount: Joi.number().integer().positive(),
      totalFee: Joi.number().integer().positive(),
      reward: Joi.number().integer().positive(),
      payloadLength: Joi.number().integer().positive(),
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
      type: Joi.number().integer().positive(),
      version: Joi.number().integer().positive(),
      senderPublicKey: Joi.string().hex().length(66),
      senderId: Joi.string().alphanum().length(34),
      recipientId: Joi.string().alphanum().length(34),
      timestamp: Joi.number().integer().positive(),
      amount: Joi.number().integer().positive(),
      fee: Joi.number().integer().positive(),
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
    version: Joi.number().integer().positive(),
    previousBlock: Joi.string(),
    payloadHash: Joi.string().hex(),
    generatorPublicKey: Joi.string().hex().length(66),
    blockSignature: Joi.string().hex(),
    timestamp: Joi.object().keys({
      from: Joi.number().integer().positive(),
      to: Joi.number().integer().positive()
    }),
    height: Joi.object().keys({
      from: Joi.number().integer().positive(),
      to: Joi.number().integer().positive()
    }),
    numberOfTransactions: Joi.object().keys({
      from: Joi.number().integer().positive(),
      to: Joi.number().integer().positive()
    }),
    totalAmount: Joi.object().keys({
      from: Joi.number().integer().positive(),
      to: Joi.number().integer().positive()
    }),
    totalFee: Joi.object().keys({
      from: Joi.number().integer().positive(),
      to: Joi.number().integer().positive()
    }),
    reward: Joi.object().keys({
      from: Joi.number().integer().positive(),
      to: Joi.number().integer().positive()
    }),
    payloadLength: Joi.object().keys({
      from: Joi.number().integer().positive(),
      to: Joi.number().integer().positive()
    })
  }
}
