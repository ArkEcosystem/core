import { app } from "@arkecosystem/core-container";
import { Blockchain, Database } from "@arkecosystem/core-interfaces";
import { formatTimestamp } from "@arkecosystem/core-utils";
import { Transaction } from "@arkecosystem/crypto";

export function transformTransaction(model) {
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const { data } = Transaction.fromBytesUnsafe(model.serialized, model.id);
    const sender = databaseService.walletManager.findByPublicKey(data.senderPublicKey).address;

    const lastBlock = blockchain.getLastBlock();

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
        timestamp: formatTimestamp(model.timestamp || data.timestamp),
    };
}
