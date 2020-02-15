import Joi from "@hapi/joi";

export const address = Joi.string()
    .alphanum()
    .length(34);
