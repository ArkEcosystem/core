'use strict';

const Joi = require('joi')

/**
 * [index description]
 * @type {Object}
 */
exports.index = {
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

// TODO: validate transaction payload?
/**
 * [store description]
 * @type {Object}
 */
exports.store = {
  payload: {}
}

/**
 * [show description]
 * @type {Object}
 */
exports.show = {
  params: {
    id: Joi.string()
  }
}

/**
 * [unconfirmed description]
 * @type {Object}
 */
exports.unconfirmed = {
  query: {
    offset: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

/**
 * [showUnconfirmed description]
 * @type {Object}
 */
exports.showUnconfirmed = {
  params: {
    id: Joi.string()
  }
}

/**
 * [search description]
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
