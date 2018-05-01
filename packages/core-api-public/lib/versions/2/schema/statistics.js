'use strict'

const Joi = require('joi')

/**
 * @type {Object}
 */
exports.transactions = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}

/**
 * @type {Object}
 */
exports.blocks = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}

/**
 * @type {Object}
 */
exports.votes = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}

/**
 * @type {Object}
 */
exports.unvotes = {
  query: {
    from: Joi.date().timestamp('unix'),
    to: Joi.date().timestamp('unix')
  }
}
