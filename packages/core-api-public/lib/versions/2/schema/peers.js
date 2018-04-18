'use strict';

const Joi = require('joi')

/**
 * [index description]
 * @type {Object}
 */
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

/**
 * [show description]
 * @type {Object}
 */
exports.show = {
  params: {
    ip: Joi.string().ip()
  }
}
