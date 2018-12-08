import { validator } from "@arkecosystem/crypto";

const Joi = validator.engine.joi;

/**
 * @type {Object}
 */
export const store = {
  payload: {
    block: Joi.arkBlock().options({ stripUnknown: true })
  }
};
