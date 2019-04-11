import { app } from "@arkecosystem/core-container";

export const postBlock = {
    type: "object",
    required: ["block"],
    additionalProperties: false,
    properties: {
        block: { $ref: "block" },
    },
};

export const postTransactions = {
    type: "object",
    required: ["transactions"],
    additionalProperties: false,
    properties: {
        transactions: {
            $ref: "transactions",
            minItems: 1,
            maxItems: app.has("transaction-pool")
                ? app.resolveOptions("transaction-pool").maxTransactionsPerRequest || 40
                : 40,
        },
    },
};
