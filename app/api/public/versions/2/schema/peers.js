const Joi = require('joi')

exports.index = {
  query: {
    os: Joi.string(),
    status: Joi.string(),
    port: Joi.number().integer(),
    version: Joi.string(),
    orderBy: Joi.string()
  }
}

exports.show = {
  params: {
    ip: Joi.string().ip()
  }
}
