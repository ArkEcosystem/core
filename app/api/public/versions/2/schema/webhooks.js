const Joi = require('joi')

exports.store = {
  event: Joi.string().required(),
  target: Joi.string().required(),
  enabled: Joi.boolean().default(true),
  conditions: Joi.array().items(Joi.object({
    key: Joi.string(),
    value: Joi.string(),
    condition: Joi.string()
  }))
}

exports.update = {
  event: Joi.string(),
  target: Joi.string(),
  enabled: Joi.boolean().default(true),
  conditions: Joi.array().items(Joi.object({
    key: Joi.string(),
    value: Joi.string(),
    condition: Joi.string()
  }))
}
