import { app, Contracts } from "@arkecosystem/core-kernel";

export const resetBlockchain = async () => {
    // Resets everything so that it can be used in beforeAll to start clean a test suite
    // Now resets: blocks (remove blocks other than genesis), transaction pool
    // TODO: reset rounds, transactions in db...

    // reset to block height 1
    const blockchain = app.get<Contracts.Blockchain.Blockchain>("blockchain");
    const height = blockchain.getLastBlock().data.height;
    if (height) {
        await blockchain.removeBlocks(height - 1);
    }

    const transactionPool = app.get<Contracts.TransactionPool.Connection>("transaction-pool");
    transactionPool.flush();
};
