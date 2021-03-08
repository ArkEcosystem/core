import Joi from "joi";

import { headers } from "./shared";

export const blocksSchemas = {
    getBlocks: Joi.object({
        lastBlockHeight: Joi.number().integer().min(1),
        blockLimit: Joi.number().integer().min(1).max(400),
        headersOnly: Joi.boolean(),
        serialized: Joi.boolean(),
        headers,
    }),

    postBlock: Joi.object({
        block: Joi.binary(),
        headers,
    }),
};
