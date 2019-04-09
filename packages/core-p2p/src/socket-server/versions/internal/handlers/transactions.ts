import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, P2P } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";
import { validate } from "../../../utils/validate";
import * as schema from "../schemas";

export const verifyTransaction = async (service: P2P.IPeerService, req) => {
    validate(schema.verifyTransaction, req.data);

    const transaction = Transactions.Transaction.fromBytes(req.data.transaction);

    return {
        data: {
            valid: await app.resolvePlugin<Database.IDatabaseService>("database").verifyTransaction(transaction),
        },
    };
};

export const getUnconfirmedTransactions = () => {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const height = blockchain.getLastBlock().data.height;
    const maxTransactions = app.getConfig().getMilestone(height).block.maxTransactions;

    return {
        data: blockchain.getUnconfirmedTransactions(maxTransactions),
    };
};
