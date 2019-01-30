import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app } from "@arkecosystem/core-kernel";
import { models } from "@arkecosystem/crypto";
import * as schema from "../schemas/transactions";

const config = app.getConfig();
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
                valid: await app.resolve<PostgresConnection>("database").verifyTransaction(transaction),
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
        const height = app.blockchain.getLastBlock().data.height;
        const maxTransactions = config.getMilestone(height).block.maxTransactions;

        return { data: app.blockchain.getUnconfirmedTransactions(maxTransactions) };
    },
};
