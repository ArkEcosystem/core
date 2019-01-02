import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { bignumify } from "@arkecosystem/core-utils";

export function transformBlockLegacy(model) {
    const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

    return {
        id: model.id,
        version: model.version,
        timestamp: model.timestamp,
        previousBlock: model.previousBlock,
        height: model.height,
        numberOfTransactions: model.numberOfTransactions,
        totalAmount: +bignumify(model.totalAmount).toFixed(),
        totalForged: +bignumify(model.reward)
            .plus(model.totalFee)
            .toString(),
        totalFee: +bignumify(model.totalFee).toFixed(),
        reward: +bignumify(model.reward).toFixed(),
        payloadLength: model.payloadLength,
        payloadHash: model.payloadHash,
        generatorPublicKey: model.generatorPublicKey,
        blockSignature: model.blockSignature,
        confirmations: lastBlock ? lastBlock.data.height - model.height : 0,
    };
}
