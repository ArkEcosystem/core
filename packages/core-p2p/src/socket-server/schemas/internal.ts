import Joi from "@hapi/joi";

export const internalSchemas = {
    emitEvent: Joi.object({
        event: Joi.string(),
        body: Joi.object(),
    }),
};
