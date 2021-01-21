import Joi from "joi";

const blockHeightSchema = Joi.number().integer().min(1);
const blockIdSchema = Joi.alternatives(
    Joi.string()
        .min(13)
        .max(20)
        .regex(/^[0-9]+$/),
    Joi.string().hex().length(64),
);

export const blockCriteriaSchemaObject = {
    id: Joi.alternatives(
        blockIdSchema,
        Joi.string()
            .regex(/^[0-9a-z%]{1,64}$/)
            .regex(/%/),
        Joi.string()
            .regex(/^[0-9%]{1,20}$/)
            .regex(/%/),
    ),
    height: Joi.alternatives(
        blockHeightSchema,
        Joi.object({ from: blockHeightSchema, to: blockHeightSchema }).or("from", "to"),
    ),
    timestamp: Joi.alternatives(
        Joi.number().integer().min(0),
        Joi.object({ from: Joi.number().integer().min(0), to: Joi.number().integer().min(0) }).or("from", "to"),
    ),
};

export const blockParamSchema = Joi.alternatives(blockIdSchema, blockHeightSchema);
