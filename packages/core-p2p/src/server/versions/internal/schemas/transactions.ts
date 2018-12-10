import Joi from "joi";

/**
 * @type {Object}
 */
export const verify = {
    payload: {
        transaction: Joi.string().hex(),
    },
};
