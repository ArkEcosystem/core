import Joi from "@hapi/joi";

export const transactionsSchemas = {
    postTransactions: Joi.object({
        transactions: Joi.array().items(Joi.binary()),
    }),
};
