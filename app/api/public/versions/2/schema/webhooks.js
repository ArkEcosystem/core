const Joi = require('joi')

module.exports = {
  event: Joi.string().required(),
  target: Joi.string().required(),
  token: Joi.string().required(),
  enabled: Joi.boolean().required(),
  options: Joi.object({
    expiration: Joi.object({
      enabled: Joi.boolean(),
      period: Joi.number()
    }),
    retry: Joi.number()
  })
}
