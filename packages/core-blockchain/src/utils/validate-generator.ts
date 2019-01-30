import { app } from "@arkecosystem/core-kernel";
import { models, slots } from "@arkecosystem/crypto";

export const validateGenerator = async (block: models.Block): Promise<boolean> => {
    const database = app.resolve("database");

    const delegates = await database.getActiveDelegates(block.data.height);
    const slot = slots.getSlotNumber(block.data.timestamp);
    const forgingDelegate = delegates[slot % delegates.length];

    const generatorUsername = database.walletManager.findByPublicKey(block.data.generatorPublicKey).username;

    if (!forgingDelegate) {
        app.logger.debug(
            `Could not decide if delegate ${generatorUsername} (${
                block.data.generatorPublicKey
            }) is allowed to forge block ${block.data.height.toLocaleString()} :grey_question:`,
        );
    } else if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
        const forgingUsername = database.walletManager.findByPublicKey(forgingDelegate.publicKey).username;

        app.logger.warn(
            `Delegate ${generatorUsername} (${
                block.data.generatorPublicKey
            }) not allowed to forge, should be ${forgingUsername} (${forgingDelegate.publicKey}) :-1:`,
        );

        return false;
    }

    app.logger.debug(
        `Delegate ${generatorUsername} (${
            block.data.generatorPublicKey
        }) allowed to forge block ${block.data.height.toLocaleString()} :+1:`,
    );

    return true;
};
