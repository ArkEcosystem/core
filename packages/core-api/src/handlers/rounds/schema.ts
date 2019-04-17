import * as Joi from "joi";

export const delegates: object = {
    params: {
        id: Joi.number()
            .integer()
            .min(1),
    },
};
