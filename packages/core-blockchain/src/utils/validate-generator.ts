import { app, Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces } from "@arkecosystem/crypto";

export const validateGenerator = async (block: Interfaces.IBlock): Promise<boolean> => {
    const database: Contracts.Database.DatabaseService = app.get<Contracts.Database.DatabaseService>(
        Container.Identifiers.DatabaseService,
    );
    const logger: Contracts.Kernel.Log.Logger = app.log;

    const roundInfo: Contracts.Shared.RoundInfo = Utils.roundCalculator.calculateRound(block.data.height);
    const delegates: Contracts.State.Wallet[] = await database.getActiveDelegates(roundInfo);
    const slot: number = Crypto.Slots.getSlotNumber(block.data.timestamp);
    const forgingDelegate: Contracts.State.Wallet = delegates[slot % delegates.length];

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

        logger.warning(
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
