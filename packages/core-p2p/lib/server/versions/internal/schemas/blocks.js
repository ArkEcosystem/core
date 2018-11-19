const Joi = require('@arkecosystem/crypto').validator.engine.joi

/**
 * @type {Object}
 */
exports.store = {
  payload: {
    block: Joi.arkBlock().options({ stripUnknown: true }),
  },
}
