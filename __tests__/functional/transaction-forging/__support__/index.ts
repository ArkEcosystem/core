import "jest-extended";

import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container, Contracts } from "@arkecosystem/core-kernel";

import secrets from "../../../../packages/core-test-framework/src/internal/passphrases.json";

jest.setTimeout(1200000);

import { DatabaseService } from "@arkecosystem/core-database";

import { Sandbox } from "../../../../packages/core-test-framework/src";

export const setUp = async (sandbox: Sandbox, crypto: CryptoSuite.CryptoSuite): Promise<Sandbox> => {
    process.env.CORE_RESET_DATABASE = "1";

    sandbox.withCoreOptions({
        flags: {
            token: "ark",
            network: "testnet",
            env: "test",
        },
        peers: {
            list: [{ ip: "127.0.0.1", port: 4000 }],
        },
    });
    await sandbox.boot(async ({ app }) => {
        await app.bootstrap({
            flags: {
                token: "ark",
                network: "testnet",
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

        crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = false;
        crypto.CryptoManager.MilestoneManager.getMilestone().htlcEnabled = false;

        await app.boot();

        crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = true;
        crypto.CryptoManager.MilestoneManager.getMilestone().htlcEnabled = true;

        const databaseService = app.get<DatabaseService>(Container.Identifiers.DatabaseService);
        const walletRepository = app.getTagged<Contracts.State.WalletRepository>(
            Container.Identifiers.WalletRepository,
            "state",
            "blockchain",
        );

        await databaseService.saveRound(
            secrets.map((secret, i) => {
                const wallet = walletRepository.findByPublicKey(
                    crypto.CryptoManager.Identities.PublicKey.fromPassphrase(secret),
                );

                wallet.setAttribute("delegate", {
                    username: `genesis_${i + 1}`,
                    voteBalance: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.make("300000000000000"),
                    forgedFees: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                    forgedRewards: crypto.CryptoManager.LibraryManager.Libraries.BigNumber.ZERO,
                    producedBlocks: 0,
                    round: 1,
                    rank: undefined,
                });

                return wallet;
            }),
        );

        // @ts-ignore
        await databaseService.initializeActiveDelegates(1);
    });

    return sandbox;
};

export const tearDown = async (sandbox: Sandbox): Promise<void> => {
    // const databaseService = sandbox.app.get<DatabaseService>(Container.Identifiers.DatabaseService);
    // await databaseService.reset();

    await sandbox.dispose();
};

export const passphrases = {
    passphrase: "this is top secret passphrase number 1",
    secondPassphrase: "this is top secret passphrase number 2",
};
