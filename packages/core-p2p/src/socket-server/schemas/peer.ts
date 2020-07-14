import Joi from "@hapi/joi";

export const peerSchemas = {
    getPeers: Joi.object().max(0), // empty object expected

    getCommonBlocks: Joi.object({
        ids: Joi.array().min(1).max(10).items(Joi.string()), // TODO strings are block ids
    }),

    getStatus: Joi.object().max(0), // empty object expected
};
