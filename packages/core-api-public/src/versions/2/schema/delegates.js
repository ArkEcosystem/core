'use strict';

const Joi = require('joi')

/**
 * [index description]
 * @type {Object}
 */
exports.index = {
  query: {
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
    id: Joi.string()
  }
}

/**
 * [blocks description]
 * @type {Object}
 */
exports.blocks = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}

/**
 * [voters description]
 * @type {Object}
 */
exports.voters = {
  params: {
    id: Joi.string()
  },
  query: {
    page: Joi.number().integer(),
    limit: Joi.number().integer()
  }
}
