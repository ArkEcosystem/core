import Joi from "joi";

/**
 * @type {Object}
 */
export const emitEvent = {
    params: {
        event: Joi.string(),
    },
};
