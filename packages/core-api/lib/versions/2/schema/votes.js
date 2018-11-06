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
      id: Joi.string().hex().length(64),
      blockId: Joi.string(),
      version: Joi.number().integer().positive(),
      senderPublicKey: Joi.string().hex().length(66),
      senderId: Joi.string().alphanum().length(34),
      recipientId: Joi.string().alphanum().length(34),
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
exports.show = {
  params: {
    id: Joi.string()
  }
}
