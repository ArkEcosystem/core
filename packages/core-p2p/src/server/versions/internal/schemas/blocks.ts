import { Joi } from "@arkecosystem/crypto";

/**
 * @type {Object}
 */
export const store = {
    payload: {
        block: Joi.block().options({ stripUnknown: true }),
    },
};
