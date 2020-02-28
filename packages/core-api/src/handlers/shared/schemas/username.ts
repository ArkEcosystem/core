import Joi from "@hapi/joi";

export const username = Joi.string()
    .regex(/^[a-z0-9!@$&_.]+$/)
    .min(1)
    .max(20);
