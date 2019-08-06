import { app } from "@arkecosystem/core-container";
import { Blockchain, Database, State } from "@arkecosystem/core-interfaces";
import { formatTimestamp } from "@arkecosystem/core-utils";
import { Interfaces, Utils } from "@arkecosystem/crypto";

export const transformBlock = (model, transform) => {
    if (!transform) {
        model.reward = Utils.BigNumber.make(model.reward).toFixed();
        model.totalFee = Utils.BigNumber.make(model.totalFee).toFixed();
        model.totalAmount = Utils.BigNumber.make(model.totalAmount).toFixed();
        return model;
    }

    const databaseService: Database.IDatabaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    const generator: State.IWallet = databaseService.walletManager.findByPublicKey(model.generatorPublicKey);
    const lastBlock: Interfaces.IBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

    model.reward = Utils.BigNumber.make(model.reward);
    model.totalFee = Utils.BigNumber.make(model.totalFee);

    return {
        id: model.id,
        version: +model.version,
        height: +model.height,
        previous: model.previousBlock,
        forged: {
            reward: model.reward.toFixed(),
            fee: model.totalFee.toFixed(),
            total: model.reward.plus(model.totalFee).toFixed(),
            amount: Utils.BigNumber.make(model.totalAmount).toFixed(),
        },
        payload: {
            hash: model.payloadHash,
            length: model.payloadLength,
        },
        generator: {
            username: generator.getAttribute("delegate.username"),
            address: generator.address,
            publicKey: generator.publicKey,
        },
        signature: model.blockSignature,
        confirmations: lastBlock ? lastBlock.data.height - model.height : 0,
        transactions: model.numberOfTransactions,
        timestamp: formatTimestamp(model.timestamp),
    };
};
