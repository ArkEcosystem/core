import Joi from "@hapi/joi";

export const blocksSchemas = {
    getBlocks: Joi.object({
        lastBlockHeight: Joi.number().integer().min(1),
        blockLimit: Joi.number().integer().min(1).max(400),
        headersOnly: Joi.boolean(),
        serialized: Joi.boolean(),
    }),

    postBlock: Joi.object({
        block: Joi.object({
            type: "Buffer",
            data: Joi.array(), // TODO better way to validate buffer ?
        }),
    }),
};
