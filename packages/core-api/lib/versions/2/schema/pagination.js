'use strict'

const Joi = require('joi')

module.exports = {
  page: Joi.number().integer(),
  limit: Joi.number().integer().max(100)
}
