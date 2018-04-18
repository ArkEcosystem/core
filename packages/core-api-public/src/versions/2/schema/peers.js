'use strict';

const Joi = require('joi')

exports.index = {
  query: {
    os: Joi.string(),
    status: Joi.string(),
    port: Joi.number().integer(),
    version: Joi.string(),
    orderBy: Joi.string(),
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

exports.show = {
  params: {
    ip: Joi.string().ip()
  }
}
