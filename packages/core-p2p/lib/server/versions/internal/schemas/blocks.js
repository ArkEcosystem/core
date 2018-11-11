const Joi = require('joi')

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    block: Joi.object(),
  },
}
