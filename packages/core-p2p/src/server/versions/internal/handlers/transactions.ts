import { app } from "@arkecosystem/core-container";
import { models } from "@arkecosystem/crypto";
import * as schema from "../schemas/transactions";

const config = app.resolvePlugin("config");
const { Transaction } = models;

/**
 * @type {Object}
 */
export const verify = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        const transaction = new Transaction(Transaction.deserialize(request.payload.transaction));

        return {
            data: {
                valid: await app.resolvePlugin("database").verifyTransaction(transaction),
            },
        };
    },
    options: {
        validate: schema.verify,
    },
};

/**
 * @type {Object}
 */
export const forging = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    handler(request, h) {
        const blockchain = app.resolvePlugin("blockchain");

        const height = blockchain.getLastBlock().data.height;
        const maxTransactions = config.getConstants(height).block.maxTransactions;

        return {
            data: blockchain.getUnconfirmedTransactions(maxTransactions, true),
        };
    },
};
