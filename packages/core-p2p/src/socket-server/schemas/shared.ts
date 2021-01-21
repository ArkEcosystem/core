import Joi from "joi";

export const headers = Joi.object({
    version: Joi.string(),
});
