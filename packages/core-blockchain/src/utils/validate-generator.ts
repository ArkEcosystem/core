import { app } from "@arkecosystem/core-container";
import { slots } from "@arkecosystem/crypto";

export const validateGenerator = async (block: any): Promise<boolean> => {
    const database = app.resolvePlugin("database");

    if (database.__isException(block.data)) {
        return true;
    }

    const delegates = await database.getActiveDelegates(block.data.height);
    const slot = slots.getSlotNumber(block.data.timestamp);
    const forgingDelegate = delegates[slot % delegates.length];

    const generatorUsername = database.walletManager.findByPublicKey(block.data.generatorPublicKey).username;

    if (!forgingDelegate) {
        this.logger.debug(
            `Could not decide if delegate ${generatorUsername} (${
                block.data.generatorPublicKey
            }) is allowed to forge block ${block.data.height.toLocaleString()} :grey_question:`,
        );

        return false;
    } else if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
        const forgingUsername = this.walletManager.findByPublicKey(forgingDelegate.publicKey).username;

        this.logger.warn(
            `Delegate ${generatorUsername} (${
                block.data.generatorPublicKey
            }) not allowed to forge, should be ${forgingUsername} (${forgingDelegate.publicKey}) :-1:`,
        );

        return false;
    }

    this.logger.debug(
        `Delegate ${generatorUsername} (${
            block.data.generatorPublicKey
        }) allowed to forge block ${block.data.height.toLocaleString()} :+1:`,
    );

    return true;
};
