const Joi = require('@phantomchain/crypto').validator.engine.joi

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    block: Joi.phantomBlock().options({ stripUnknown: true }),
  },
}
