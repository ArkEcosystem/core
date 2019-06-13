import * as Joi from "@hapi/joi";

export const delegates: object = {
    params: {
        id: Joi.number()
            .integer()
            .min(1),
    },
};
