import Joi from "joi";

/**
 * @type {Object}
 */
export const emitEvent = {
    payload: {
        event: Joi.string(),
        body: Joi.any(),
    },
};
