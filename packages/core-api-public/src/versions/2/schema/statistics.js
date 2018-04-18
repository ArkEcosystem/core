'use strict';

const Joi = require('joi')

/**
 * [transactions description]
 * @type {Object}
 */
exports.transactions = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}

/**
 * [blocks description]
 * @type {Object}
 */
exports.blocks = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}

/**
 * [votes description]
 * @type {Object}
 */
exports.votes = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}

/**
 * [unvotes description]
 * @type {Object}
 */
exports.unvotes = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}
