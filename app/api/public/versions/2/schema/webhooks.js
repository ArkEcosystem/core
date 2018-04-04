const Joi = require('joi')
const config = require('../../../../../core/config')

const events = config.webhooks.events.map(event => event.name)

const conditions = [
  'between', 'contains', 'eq', 'falsy', 'gt', 'gte',
  'lt', 'lte', 'ne', 'not-between', 'regexp', 'truthy'
]

exports.store = {
  event: Joi.string().valid(events).required(),
  target: Joi.string().required().uri(),
  enabled: Joi.boolean().default(true),
  conditions: Joi.array().items(Joi.object({
    key: Joi.string(),
    value: Joi.string(),
    condition: Joi.string().valid(conditions)
  }))
}

exports.update = {
  event: Joi.string().valid(events),
  target: Joi.string().uri(),
  enabled: Joi.boolean(),
  conditions: Joi.array().items(Joi.object({
    key: Joi.string(),
    value: Joi.string(),
    condition: Joi.string().valid(conditions)
  }))
}
