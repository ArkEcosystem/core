'use strict'

const Joi = require('joi')
const container = require('@arkecosystem/core-container')

/**
 * @type {Object}
 */
exports.emitEvent = {
  params: {
    event: Joi.string().valid(container.resolvePlugin('blockchain').events)
  }
}
