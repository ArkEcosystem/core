import "jest-extended";

import { Container, Contracts } from "@arkecosystem/core-kernel";
import { Identities, Utils } from "@arkecosystem/crypto";
import secrets from "@packages/core-test-framework/src/internal/passphrases.json";

jest.setTimeout(1200000);

import { DatabaseService } from "@arkecosystem/core-database";
import { Sandbox } from "@packages/core-test-framework/src";

const sandbox: Sandbox = new Sandbox();

export const setUp = async (): Promise<Contracts.Kernel.Application> => {
    process.env.CORE_RESET_DATABASE = "1";

    await sandbox.boot(async ({ app }) => {
        await app.bootstrap({
            flags: {
                token: "ark",
                network: "unitnet",
                env: "test",
                processType: "core",
            },
            plugins: {
                include: [
                    "@arkecosystem/core-state",
                    "@arkecosystem/core-database",
                    "@arkecosystem/core-transactions",
                    "@arkecosystem/core-magistrate-transactions",
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

        const databaseService = app.get<DatabaseService>(Container.Identifiers.DatabaseService);
        const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
            Container.Identifiers.WalletRepository,
            "state",
            "blockchain",
        );

        await databaseService.buildWallets();
        await databaseService.saveRound(
            secrets.map((secret, i) => {
                const wallet = walletRepository.findByPublicKey(Identities.PublicKey.fromPassphrase(secret));

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
    });

    return sandbox.app;
};

export const tearDown = async (): Promise<void> => {
    // const databaseService = sandbox.app.get<DatabaseService>(Container.Identifiers.DatabaseService);
    // await databaseService.reset();

    await sandbox.dispose();
};

export const passphrases = {
    passphrase: "this is top secret passphrase number 1",
    secondPassphrase: "this is top secret passphrase number 2",
};
