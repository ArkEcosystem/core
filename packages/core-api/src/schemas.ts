import Joi from "@hapi/joi";

export const createSchemas = ({ pagination }: { pagination: { limit: number } }) => ({
    pagination: {
        page: Joi.number()
            .integer()
            .positive()
            .default(1),
        offset: Joi.number()
            .integer()
            .min(0),
        limit: Joi.number()
            .integer()
            .min(1)
            .default(100)
            .max(pagination.limit),
    },
    blockId: Joi.alternatives().try(
        Joi.string()
            .min(1)
            .max(20)
            .regex(/^[0-9]+$/, "decimal non-negative integer"),
        Joi.string()
            .length(64)
            .hex(),
    ),
    address: Joi.string()
        .alphanum()
        .length(34),
    delegateIdentifier: Joi.string()
        .regex(/^[a-zA-Z0-9!@$&_.]+$/)
        .min(1)
        .max(66),
    username: Joi.string()
        .regex(/^[a-z0-9!@$&_.]+$/)
        .min(1)
        .max(20),
    integerBetween: Joi.object().keys({
        from: Joi.number()
            .integer()
            .min(0),
        to: Joi.number()
            .integer()
            .min(0),
    }),
    percentage: Joi.object().keys({
        from: Joi.number()
            .precision(2)
            .min(0)
            .max(100),
        to: Joi.number()
            .precision(2)
            .min(0)
            .max(100),
    }),
});
