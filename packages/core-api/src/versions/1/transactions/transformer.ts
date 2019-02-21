import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";
import { crypto, Transaction } from "@arkecosystem/crypto";

export function transformTransactionLegacy(model) {
    const config = app.getConfig();
    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");

    const { data } = Transaction.fromBytes(model.serialized);

    return {
        id: data.id,
        blockid: model.blockId,
        type: data.type,
        timestamp: model.timestamp || data.timestamp,
        amount: +bignumify(data.amount).toFixed(),
        fee: +bignumify(data.fee).toFixed(),
        recipientId: data.recipientId,
        senderId: crypto.getAddress(data.senderPublicKey, config.get("network.pubKeyHash")),
        senderPublicKey: data.senderPublicKey,
        vendorField: data.vendorField,
        signature: data.signature,
        signSignature: data.signSignature,
        signatures: data.signatures,
        asset: data.asset || {},
        confirmations: model.block ? blockchain.getLastBlock().data.height - model.block.height : 0,
    };
}
