'use strict'

const Joi = require('joi')
const pagination = require('./pagination')

/**
 * @type {Object}
 */
exports.index = {
  query: { ...pagination, ...{ orderBy: Joi.string() } }
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
exports.search = {
  query: pagination,
  payload: {
    username: Joi.string()
  }
}

/**
 * @type {Object}
 */
exports.blocks = {
  params: {
    id: Joi.string()
  },
  query: pagination
}

/**
 * @type {Object}
 */
exports.voters = {
  params: {
    id: Joi.string()
  },
  query: pagination
}

/**
 * @type {Object}
 */
exports.voterBalances = {
  params: {
    id: Joi.string()
  }
}
