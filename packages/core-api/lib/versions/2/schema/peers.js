const Joi = require('joi')
const pagination = require('./pagination')

/**
 * @type {Object}
 */
exports.index = {
  query: {
    ...pagination,
    ...{
      ip: Joi.string().ip(),
      os: Joi.string(),
      status: Joi.string(),
      port: Joi.number().port(),
      version: Joi.string(),
      orderBy: Joi.string(),
    },
  },
}

/**
 * @type {Object}
 */
exports.show = {
  params: {
    ip: Joi.string().ip(),
  },
}
