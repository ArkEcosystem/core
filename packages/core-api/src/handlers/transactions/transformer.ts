import { app, Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Interfaces, Transactions } from "@arkecosystem/crypto";

// todo: review the implementation
export const transformTransaction = (model, transform) => {
    const blockchain = app.get<Contracts.Blockchain.Blockchain>(Container.Identifiers.BlockchainService);

    const transaction: Interfaces.ITransaction = Transactions.TransactionFactory.fromBytesUnsafe(
        model.serialized,
        model.id,
    );

    if (!transform) {
        return transaction.toJson();
    }

    const { data } = transaction;

    const sender: Contracts.State.Wallet = app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .walletRepository.findByPublicKey(Utils.assert.defined(data.senderPublicKey));

    const lastBlock: Interfaces.IBlock = blockchain.getLastBlock();
    const timestamp: number = data.version === 1 ? data.timestamp : model.timestamp;
    const nonce: string = data.nonce ? data.nonce.toFixed() : model.nonce ? model.nonce : undefined;

    return {
        id: data.id,
        blockId: model.blockId,
        version: data.version,
        type: data.type,
        typeGroup: data.typeGroup,
        amount: data.amount.toFixed(),
        fee: data.fee.toFixed(),
        sender,
        senderPublicKey: data.senderPublicKey,
        recipient: data.recipientId || sender.address,
        signature: data.signature,
        signSignature: data.signSignature || data.secondSignature,
        signatures: data.signatures,
        vendorField: data.vendorField,
        asset: data.asset,
        confirmations: model.block ? lastBlock.data.height - model.block.height + 1 : 0,
        timestamp: timestamp !== undefined ? Utils.formatTimestamp(timestamp) : undefined,
        nonce,
    };
};
