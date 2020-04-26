import Joi from "@hapi/joi";

export const peerSchemas = {
    getPeers: Joi.object().max(0), // empty object expected

    getBlocks: Joi.object({
        lastBlockHeight: Joi.number().integer().min(1),
        blockLimit: Joi.number().integer().min(1).max(400),
        headersOnly: Joi.boolean(),
        serialized: Joi.boolean(),
    }),

    getCommonBlocks: Joi.object({
        ids: Joi.array().min(1).max(10).items(Joi.string()), // TODO strings are block ids
    }),

    getStatus: Joi.object().max(0), // empty object expected

    postBlock: Joi.object({
        block: Joi.object({
            type: "Buffer",
            data: Joi.array(), // TODO better way to validate buffer ?
        }),
    }),

    postTransactions: Joi.object({
        transactions: Joi.array(), // TODO array of transactions, needs Joi transaction schema
    }),
};
