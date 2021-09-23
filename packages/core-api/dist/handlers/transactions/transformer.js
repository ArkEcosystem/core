"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_container_1 = require("@arkecosystem/core-container");
const core_utils_1 = require("@arkecosystem/core-utils");
const crypto_1 = require("@arkecosystem/crypto");
exports.transformTransaction = (model, transform) => {
    const blockchain = core_container_1.app.resolvePlugin("blockchain");
    const databaseService = core_container_1.app.resolvePlugin("database");
    const transaction = crypto_1.Transactions.TransactionFactory.fromBytesUnsafe(model.serialized, model.id);
    if (!transform) {
        return transaction.toJson();
    }
    const { data } = transaction;
    const sender = databaseService.walletManager.findByPublicKey(data.senderPublicKey).address;
    const lastBlock = blockchain.getLastBlock();
    const timestamp = data.version === 1 ? data.timestamp : model.timestamp;
    const nonce = data.nonce ? data.nonce.toFixed() : model.nonce ? model.nonce : undefined;
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
        recipient: data.recipientId || sender,
        signature: data.signature,
        signSignature: data.signSignature || data.secondSignature,
        signatures: data.signatures,
        vendorField: data.vendorField,
        asset: data.asset,
        confirmations: model.block ? lastBlock.data.height - model.block.height + 1 : 0,
        timestamp: timestamp !== undefined ? core_utils_1.formatTimestamp(timestamp) : undefined,
        nonce,
    };
};
//# sourceMappingURL=transformer.js.map