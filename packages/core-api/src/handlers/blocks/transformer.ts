import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { formatTimestamp } from "@arkecosystem/core-utils";
import { Utils } from "@arkecosystem/crypto";

export function transformBlock(model) {
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    const generator = databaseService.walletManager.findByPublicKey(model.generatorPublicKey);

    model.reward = Utils.BigNumber.make(model.reward);
    model.totalFee = Utils.BigNumber.make(model.totalFee);

    return {
        id: model.id,
        version: +model.version,
        height: +model.height,
        previous: model.previousBlock,
        forged: {
            reward: +model.reward.toFixed(),
            fee: +model.totalFee.toFixed(),
            total: +model.reward.plus(model.totalFee).toFixed(),
            amount: +Utils.BigNumber.make(model.totalAmount).toFixed(),
        },
        payload: {
            hash: model.payloadHash,
            length: model.payloadLength,
        },
        generator: {
            username: generator.username,
            address: generator.address,
            publicKey: generator.publicKey,
        },
        signature: model.blockSignature,
        confirmations: model.confirmations,
        transactions: model.numberOfTransactions,
        timestamp: formatTimestamp(model.timestamp),
    };
}
