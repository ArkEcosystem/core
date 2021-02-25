import Joi from "joi";

import { headers } from "./shared";

export const peerSchemas = {
    getPeers: Joi.object({
        headers,
    }),

    getCommonBlocks: Joi.object({
        ids: Joi.array().min(1).max(10).items(Joi.string()), // TODO strings are block ids
        headers,
    }),

    getStatus: Joi.object({
        headers,
    }),
};
