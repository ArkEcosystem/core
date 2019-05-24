import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { formatTimestamp } from "@arkecosystem/core-utils";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

export const transformTransaction = (model, transform) => {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const transaction: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytesUnsafe(
        model.serialized,
        model.id,
    );

    if (!transform) {
        return transaction.toJson();
    }

    const { data } = transaction;

    const sender: string = databaseService.walletManager.findByPublicKey(data.senderPublicKey).address;

    const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();

    return {
        id: data.id,
        blockId: model.blockId,
        version: data.version,
        type: data.type,
        amount: +data.amount,
        fee: +data.fee,
        sender,
        recipient: data.recipientId,
        signature: data.signature,
        signSignature: data.signSignature,
        signatures: data.signatures,
        vendorField: data.vendorField,
        asset: data.asset,
        confirmations: model.block ? lastBlock.data.height - model.block.height : 0,
        timestamp: formatTimestamp(data.timestamp),
    };
};
