const Joi = require('joi')

module.exports = {
  event: Joi.string().required(),
  target: Joi.string().required(),
  enabled: Joi.boolean().required(),
  options: Joi.object({
    secret: Joi.string(),
    expiration: Joi.object({
      enabled: Joi.boolean(),
      period: Joi.number()
    }),
    retry: Joi.number()
  })
}
