import Joi from "@hapi/joi";

export const walletId = Joi.alternatives().try(
    Joi.string()
        .regex(/^[a-z0-9!@$&_.]+$/)
        .min(1)
        .max(20),
    Joi.string()
        .alphanum()
        .length(34),
    Joi.string()
        .hex()
        .length(66),
);
