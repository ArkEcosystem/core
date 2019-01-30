import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app } from "@arkecosystem/core-kernel";
import { bignumify, formatTimestamp } from "@arkecosystem/core-utils";

export function transformBlock(model) {
    const database = app.resolve<PostgresConnection>("database");
    const generator = database.walletManager.findByPublicKey(model.generatorPublicKey);

    model.reward = bignumify(model.reward);
    model.totalFee = bignumify(model.totalFee);

    return {
        id: model.id,
        version: +model.version,
        height: +model.height,
        previous: model.previousBlock,
        forged: {
            reward: +model.reward.toFixed(),
            fee: +model.totalFee.toFixed(),
            total: +model.reward.plus(model.totalFee).toFixed(),
            amount: +bignumify(model.totalAmount).toFixed(),
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
