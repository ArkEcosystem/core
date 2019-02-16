import joi from "joi";
/**
 * @type {Object}
 */
export const store = {
    payload: {
        block: joi // TODO: fixme
            .any()
            .options({ stripUnknown: true }),
    },
};
