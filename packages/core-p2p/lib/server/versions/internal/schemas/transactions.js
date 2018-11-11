const Joi = require('joi')

/**
 * @type {Object}
 */
exports.verify = {
  payload: {
    transaction: Joi.string().hex(),
  },
}
