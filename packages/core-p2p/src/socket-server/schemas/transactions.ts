import Joi from "@hapi/joi";

export const transactionsSchemas = {
    postTransactions: Joi.object({
        transactions: Joi.array(), // TODO array of transactions, needs Joi transaction schema
    }),
};
