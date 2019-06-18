import * as Joi from "@hapi/joi";

export const pagination = {
    page: Joi.number()
        .integer()
        .positive(),
    offset: Joi.number()
        .integer()
        .min(0),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100),
};
