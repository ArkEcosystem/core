import { app, Contracts } from "@arkecosystem/core-kernel";
import { roundCalculator } from "@arkecosystem/core-utils";
import { Crypto, Interfaces } from "@arkecosystem/crypto";

export const validateGenerator = async (block: Interfaces.IBlock): Promise<boolean> => {
    const database: Contracts.Database.IDatabaseService = app.resolve<Contracts.Database.IDatabaseService>("database");
    const logger: Contracts.Kernel.ILogger = app.resolve<Contracts.Kernel.ILogger>("logger");

    const roundInfo: Contracts.Shared.IRoundInfo = roundCalculator.calculateRound(block.data.height);
    const delegates: Contracts.State.IWallet[] = await database.getActiveDelegates(roundInfo);
    const slot: number = Crypto.Slots.getSlotNumber(block.data.timestamp);
    const forgingDelegate: Contracts.State.IWallet = delegates[slot % delegates.length];

    const generatorUsername: string = database.walletManager
        .findByPublicKey(block.data.generatorPublicKey)
        .getAttribute("delegate.username");

    if (!forgingDelegate) {
        logger.debug(
            `Could not decide if delegate ${generatorUsername} (${
                block.data.generatorPublicKey
            }) is allowed to forge block ${block.data.height.toLocaleString()}`,
        );
    } else if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
        const forgingUsername: string = database.walletManager
            .findByPublicKey(forgingDelegate.publicKey)
            .getAttribute("delegate.username");

        logger.warn(
            `Delegate ${generatorUsername} (${block.data.generatorPublicKey}) not allowed to forge, should be ${forgingUsername} (${forgingDelegate.publicKey})`,
        );

        return false;
    }

    logger.debug(
        `Delegate ${generatorUsername} (${
            block.data.generatorPublicKey
        }) allowed to forge block ${block.data.height.toLocaleString()}`,
    );

    return true;
};
