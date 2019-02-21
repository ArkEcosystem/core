import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { models } from "@arkecosystem/crypto";
// import * as schema from "../schemas/transactions";

const config = app.getConfig();
const { Transaction } = models;

export const verifyTransaction = async req => {
    const transaction = new Transaction(Transaction.deserialize(req.data.transaction));

    return {
        data: {
            valid: await app.resolvePlugin<Database.IDatabaseService>("database").verifyTransaction(transaction),
        },
    };
    /*,
    options: {
        validate: schema.verify,
    },
    */
};

export const getUnconfirmedTransactions = () => {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const height = blockchain.getLastBlock().data.height;
    const maxTransactions = config.getMilestone(height).block.maxTransactions;

    return {
        data: blockchain.getUnconfirmedTransactions(maxTransactions),
    };
};
