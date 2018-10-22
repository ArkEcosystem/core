'use strict'

const Joi = require('joi')

/**
 * @type {Object}
 */
exports.emitEvent = {
  params: {
    event: Joi.string()
  }
}
