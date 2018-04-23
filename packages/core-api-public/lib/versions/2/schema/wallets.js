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
 * [transactions description]
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
 * [transactionsSent description]
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
 * [transactionsReceived description]
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
 * [votes description]
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
 * [search description]
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
