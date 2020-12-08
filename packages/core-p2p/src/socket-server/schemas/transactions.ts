import Joi from "@hapi/joi";
import { headers } from "./shared";

export const transactionsSchemas = {
    postTransactions: Joi.object({
        transactions: Joi.array().items(Joi.binary()),
        headers,
    }),
};
