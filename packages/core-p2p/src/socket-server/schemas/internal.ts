import Joi from "@hapi/joi";

export const internalSchemas = {
    "p2p.internal.emitEvent": Joi.object({
        event: Joi.string(),
        body: Joi.object(),
    }),
};
