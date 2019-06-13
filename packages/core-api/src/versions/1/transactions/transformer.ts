import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { Transactions } from "@arkecosystem/crypto";

export const transformTransactionLegacy = model => {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const { data } = Transactions.TransactionFactory.fromBytesUnsafe(model.serialized, model.id);
    const senderId = databaseService.walletManager.findByPublicKey(data.senderPublicKey).address;

    return {
        id: data.id,
        blockid: model.blockId,
        type: data.type,
        timestamp: model.timestamp || data.timestamp,
        amount: +data.amount,
        fee: +data.fee,
        recipientId: data.recipientId,
        senderId,
        senderPublicKey: data.senderPublicKey,
        vendorField: data.vendorField,
        signature: data.signature,
        signSignature: data.signSignature || data.secondSignature,
        signatures: data.signatures,
        asset: data.asset || {},
        confirmations: model.block ? blockchain.getLastBlock().data.height - model.block.height : 0,
    };
};
