const Joi = require('joi')

/**
 * @type {Object}
 */
exports.emitEvent = {
  payload: {
    event: Joi.string(),
    body: Joi.any(),
  },
}
