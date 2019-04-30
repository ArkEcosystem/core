import * as Joi from "@hapi/joi";

export const blockId = Joi.alternatives().try(
    Joi.string()
        .min(1)
        .max(20)
        .regex(/^[0-9]+$/, "decimal non-negative integer"),
    Joi.string()
        .length(64)
        .hex(),
);
