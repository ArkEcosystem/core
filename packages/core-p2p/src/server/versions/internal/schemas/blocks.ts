import crypto from "@arkecosystem/crypto";
const Joi = crypto.validator.engine.joi;

/**
 * @type {Object}
 */
export const store = {
  payload: {
    block: Joi.arkBlock().options({ stripUnknown: true }),
  },
};
