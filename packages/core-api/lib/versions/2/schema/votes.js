'use strict'

const Joi = require('joi')
const pagination = require('./pagination')

/**
 * @type {Object}
 */
exports.index = {
  query: pagination
}

/**
 * @type {Object}
 */
exports.show = {
  params: {
    id: Joi.string()
  }
}
