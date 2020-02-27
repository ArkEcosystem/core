import Joi from "@hapi/joi";

export const genericName = Joi.string()
    .regex(/^[a-zA-Z0-9]+(( - |[ ._-])[a-zA-Z0-9]+)*[.]?$/)
    .min(1)
    .max(40);
