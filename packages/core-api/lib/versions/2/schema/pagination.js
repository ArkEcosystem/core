'use strict'

const Joi = require('joi')

module.exports = {
  page: Joi.number().integer(),
  offset: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100)
}
