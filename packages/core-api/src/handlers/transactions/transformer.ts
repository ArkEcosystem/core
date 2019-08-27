import { app, Contracts, Container } from "@arkecosystem/core-kernel";
import { formatTimestamp } from "@arkecosystem/core-utils";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

export const transformTransaction = (model, transform) => {
    const blockchain = app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);
    const databaseService = app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);

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
        amount: data.amount.toFixed(),
        fee: data.fee.toFixed(),
        sender,
        senderPublicKey: data.senderPublicKey,
        recipient: data.recipientId || sender,
        signature: data.signature,
        signSignature: data.signSignature || data.secondSignature,
        signatures: data.signatures,
        vendorField: data.vendorField,
        asset: data.asset,
        confirmations: model.block ? lastBlock.data.height - model.block.height + 1 : 0,
        timestamp: data.version === 1 ? formatTimestamp(data.timestamp) : undefined,
        nonce: data.version > 1 ? data.nonce.toFixed() : undefined,
    };
};
