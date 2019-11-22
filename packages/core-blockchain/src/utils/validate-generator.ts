import { DatabaseService } from "@arkecosystem/core-database";
import { Container, Contracts, Utils } from "@arkecosystem/core-kernel";
import { Crypto, Interfaces } from "@arkecosystem/crypto";

// todo: review the implementation
export const validateGenerator = async (
    app: Contracts.Kernel.Application,
    block: Interfaces.IBlock,
): Promise<boolean> => {
    const database: DatabaseService = app.get<DatabaseService>(Container.Identifiers.DatabaseService);
    const logger: Contracts.Kernel.Logger = app.log;

    const roundInfo: Contracts.Shared.RoundInfo = Utils.roundCalculator.calculateRound(block.data.height);
    const delegates: Contracts.State.Wallet[] = await database.getActiveDelegates(roundInfo);
    const slot: number = Crypto.Slots.getSlotNumber(block.data.timestamp);
    const forgingDelegate: Contracts.State.Wallet = delegates[slot % delegates.length];

    const walletRepository: Contracts.State.WalletRepository = app.get<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
    );
    const generatorWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(block.data.generatorPublicKey);

    const generatorUsername: string = generatorWallet.getAttribute("delegate.username");

    if (!forgingDelegate) {
        logger.debug(
            `Could not decide if delegate ${generatorUsername} (${
                block.data.generatorPublicKey
            }) is allowed to forge block ${block.data.height.toLocaleString()}`,
        );
    } else if (forgingDelegate.publicKey !== block.data.generatorPublicKey) {
        Utils.assert.defined<string>(forgingDelegate.publicKey);

        const forgingWallet: Contracts.State.Wallet = walletRepository.findByPublicKey(forgingDelegate.publicKey);
        const forgingUsername: string = forgingWallet.getAttribute("delegate.username");

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
