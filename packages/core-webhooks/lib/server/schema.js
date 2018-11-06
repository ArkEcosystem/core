'use strict'

const Joi = require('joi')

const conditions = [
  'between', 'contains', 'eq', 'falsy', 'gt', 'gte',
  'lt', 'lte', 'ne', 'not-between', 'regexp', 'truthy'
]

/**
 * @return {Object}
 */
exports.index = {
  query: {
    page: Joi.number().integer().positive(),
    limit: Joi.number().integer().positive()
  }
}

/**
 * @return {Object}
 */
exports.show = {
  params: {
    id: Joi.string()
  }
}

/**
 * @return {Object}
 */
exports.store = {
  payload: {
    event: Joi.string().required(),
    target: Joi.string().required().uri(),
    enabled: Joi.boolean().default(true),
    conditions: Joi.array().items(Joi.object({
      key: Joi.string(),
      value: Joi.any(),
      condition: Joi.string().valid(conditions)
    }))
  }
}

/**
 * @return {Object}
 */
exports.update = {
  params: {
    id: Joi.string()
  },
  payload: {
    event: Joi.string(),
    target: Joi.string().uri(),
    enabled: Joi.boolean(),
    conditions: Joi.array().items(Joi.object({
      key: Joi.string(),
      value: Joi.any(),
      condition: Joi.string().valid(conditions)
    }))
  }
}

/**
 * @return {Object}
 */
exports.destroy = {
  params: {
    id: Joi.string()
  }
}
