import Joi from "@hapi/joi";

export const publicKey = Joi.string()
    .hex()
    .length(66);
