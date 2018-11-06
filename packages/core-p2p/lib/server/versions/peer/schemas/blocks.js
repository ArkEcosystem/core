'use strict'

const Joi = require('joi')

/**
 * @type {Object}
 */
exports.index = {
  query: {
    height: Joi.number().integer().optional()
  }
}

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    block: Joi.object()
  }
}

/**
 * @type {Object}
 */
exports.common = {
  query: {
    blocks: Joi.string()
  }
}
