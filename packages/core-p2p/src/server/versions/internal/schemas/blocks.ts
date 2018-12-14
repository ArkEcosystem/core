import { Joi } from "@arkecosystem/crypto";

/**
 * @type {Object}
 */
export const store = {
    payload: {
        block: Joi.arkBlock().options({ stripUnknown: true }),
    },
};
