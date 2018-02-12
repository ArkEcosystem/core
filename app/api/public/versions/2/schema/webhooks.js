const Joi = require('joi')

module.exports = {
  event: Joi.string().required(),
  target: Joi.string().required(),
  enabled: Joi.boolean().default(true),
  conditions: Joi.array().items(Joi.object({
    key: Joi.string(),
    value: Joi.string(),
    condition: Joi.string()
  }))
}
