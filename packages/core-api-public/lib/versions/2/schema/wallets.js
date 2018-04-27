'use strict';

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
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

/**
 * @type {Object}
 */
exports.transactionsSent = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

/**
 * @type {Object}
 */
exports.transactionsReceived = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

/**
 * @type {Object}
 */
exports.votes = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
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
    address: Joi.string(),
    publicKey: Joi.string(),
    secondPublicKey: Joi.string(),
    vote: Joi.string(),
    username: Joi.string(),
    balance: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    }),
    votebalance: Joi.object().keys({
      from: Joi.number().integer(),
      to: Joi.number().integer()
    })
  }
}
