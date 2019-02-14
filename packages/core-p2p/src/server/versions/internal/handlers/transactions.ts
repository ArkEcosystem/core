import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { models } from "@arkecosystem/crypto";
import * as schema from "../schemas/transactions";

const config = app.getConfig();
const { Transaction } = models;

/**
 * @type {Object}
 */
export const verify: object = {
    /**
     * @param  {Hapi.Request} request
     * @param  {Hapi.Toolkit} h
     * @return {Hapi.Response}
     */
    async handler(request, h) {
        const transaction = new Transaction(Transaction.deserialize(request.payload.transaction));

        return {
            data: {
                valid: await app.resolvePlugin<Database.IDatabaseService>("database").verifyTransaction(transaction),
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
        const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

        const height = blockchain.getLastBlock().data.height;
        const maxTransactions = config.getMilestone(height).block.maxTransactions;

        return {
            data: blockchain.getUnconfirmedTransactions(maxTransactions),
        };
    },
};
