import Joi from "@hapi/joi";

export const headers = Joi.object({
    version: Joi.string(),
});
