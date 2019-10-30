import "jest-extended";

import { app, Utils as AppUtils, Contracts, Container } from "@arkecosystem/core-kernel";
import { Crypto, Managers, Utils, Identities } from "@arkecosystem/crypto";
import cloneDeep from "lodash.clonedeep";
import { secrets } from "@packages/core-test-framework/src/utils/config/delegates.json";
import { resolve } from "path";

jest.setTimeout(1200000);

export const setUp = async (): Promise<void> => {
    try {
        process.env.CORE_RESET_DATABASE = "1";
        process.env.CORE_PATH_CONFIG = resolve(__dirname, "../../../../packages/core-test-framework/src/utils/config");

        await app.bootstrap({
            flags: {
                token: "ark",
                network: "unitnet",
                env: "test",
            },
            plugins: {
                include: [
                    "@arkecosystem/core-transactions",
                    "@arkecosystem/core-state",
                    "@arkecosystem/core-magistrate-transactions",
                    "@arkecosystem/core-database",
                    "@arkecosystem/core-database-postgres",
                    "@arkecosystem/core-transaction-pool",
                    "@arkecosystem/core-p2p",
                    "@arkecosystem/core-blockchain",
                    "@arkecosystem/core-api",
                    "@arkecosystem/core-forger",
                ],
                options: {
                    "@arkecosystem/core-blockchain": {
                        networkStart: true,
                    },
                },
            },
        });

        await app.boot();

        const databaseService = app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);
        await databaseService.buildWallets();
        await databaseService.saveRound(
            secrets.map((secret, i) => {
                const wallet = databaseService.walletRepository.findByPublicKey(
                    Identities.PublicKey.fromPassphrase(secret),
                );

                wallet.setAttribute("delegate", {
                    username: `genesis_${i + 1}`,
                    voteBalance: Utils.BigNumber.make("300000000000000"),
                    forgedFees: Utils.BigNumber.ZERO,
                    forgedRewards: Utils.BigNumber.ZERO,
                    producedBlocks: 0,
                    round: 1,
                    rank: undefined,
                });

                return wallet;
            }),
        );

        await (databaseService as any).initializeActiveDelegates(1);
    } catch (error) {
        console.log(error);
    }
};

export const tearDown = async (): Promise<void> => {
    const databaseService = app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);
    await databaseService.reset();

    await app.terminate();
};

export const snoozeForBlock = async (sleep: number = 0, height: number = 1): Promise<void> => {
    const blockTime = Managers.configManager.getMilestone(height).blocktime * 1000;
    const remainingTimeInSlot = Crypto.Slots.getTimeInMsUntilNextSlot();
    const sleepTime = sleep * 1000;

    return AppUtils.sleep(blockTime + remainingTimeInSlot + sleepTime);
};

export const injectMilestone = (index: number, milestone: Record<string, any>): void => {
    (Managers.configManager as any).milestones.splice(index, 0, {
        ...cloneDeep(Managers.configManager.getMilestone()),
        ...milestone,
    });
};

export const getLastHeight = (): number =>
    app.get<Contracts.State.StateStore>(Container.Identifiers.StateStore).getLastHeight();

export const getSenderNonce = (senderPublicKey: string): Utils.BigNumber =>
    app
        .get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService)
        .walletRepository.getNonce(senderPublicKey);

export const passphrases = {
    passphrase: "this is top secret passphrase number 1",
    secondPassphrase: "this is top secret passphrase number 2",
};
