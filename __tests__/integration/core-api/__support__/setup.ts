import { CryptoSuite } from "@arkecosystem/core-crypto";
import { Container, Contracts, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Types } from "@arkecosystem/crypto";
import { ServiceProvider } from "@packages/core-api/src";
import { Sandbox } from "@packages/core-test-framework/src";
import { resolve } from "path";

export const setUp = async (sandbox: Sandbox, crypto: CryptoSuite.CryptoSuite) => {
    jest.setTimeout(60000);

    process.env.DISABLE_P2P_SERVER = "true"; // no need for p2p socket server to run
    process.env.CORE_RESET_DATABASE = "1";

    sandbox.withCoreOptions({
        flags: {
            token: "ark",
            network: "unitnet",
            env: "test",
        },
        peers: {
            list: [{ ip: "127.0.0.1", port: 4000 }], // need some peers defined for the app to run
        },
    });
    await sandbox
        .withCoreOptions({
            app: {
                core: {
                    plugins: [
                        {
                            package: "@arkecosystem/core-state",
                        },
                        {
                            package: "@arkecosystem/core-database",
                        },
                        {
                            package: "@arkecosystem/core-transactions",
                        },
                        {
                            package: "@arkecosystem/core-magistrate-transactions",
                        },
                        {
                            package: "@arkecosystem/core-transaction-pool",
                        },
                        {
                            package: "@arkecosystem/core-p2p",
                        },
                        {
                            package: "@arkecosystem/core-blockchain",
                        },
                        {
                            package: "@arkecosystem/core-forger",
                        },
                    ],
                },
                relay: {
                    plugins: [
                        {
                            package: "@arkecosystem/core-state",
                        },
                        {
                            package: "@arkecosystem/core-database",
                        },
                        {
                            package: "@arkecosystem/core-transactions",
                        },
                        {
                            package: "@arkecosystem/core-magistrate-transactions",
                        },
                        {
                            package: "@arkecosystem/core-transaction-pool",
                        },
                        {
                            package: "@arkecosystem/core-p2p",
                        },
                        {
                            package: "@arkecosystem/core-blockchain",
                        },
                    ],
                },
                forger: {
                    plugins: [
                        {
                            package: "@arkecosystem/core-forger",
                        },
                    ],
                },
            },
        })
        .boot(async ({ app }) => {
            await app.bootstrap({
                flags: {
                    token: "ark",
                    network: "unitnet",
                    env: "test",
                    processType: "core",
                },
            });

            // We need to manually register the service provider from source so that jest can collect coverage.
            sandbox.registerServiceProvider({
                name: "@arkecosystem/core-api",
                path: resolve(__dirname, "../../../../packages/core-api"),
                klass: ServiceProvider,
            });

            crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = false;
            crypto.CryptoManager.MilestoneManager.getMilestone().htlcEnabled = false;

            await app.boot();

            crypto.CryptoManager.MilestoneManager.getMilestone().aip11 = true;
            crypto.CryptoManager.MilestoneManager.getMilestone().htlcEnabled = true;
            app.get<any>(Container.Identifiers.CryptoManager).MilestoneManager.getMilestone().aip11 = true;
            app.get<any>(Container.Identifiers.CryptoManager).MilestoneManager.getMilestone().htlcEnabled = true;

            await AppUtils.sleep(1000); // give some more time for api server to be up
        });

    return sandbox.app;
};

export const tearDown = async (sandbox: Sandbox) => await sandbox.dispose();

export const calculateRanks = async (sandbox: Sandbox) => {
    const walletRepository = sandbox.app.getTagged<Contracts.State.WalletRepository>(
        Container.Identifiers.WalletRepository,
        "state",
        "blockchain",
    );

    const delegateWallets = Object.values(
        walletRepository.allByUsername(),
    ).sort((a: Contracts.State.Wallet, b: Contracts.State.Wallet) =>
        b
            .getAttribute<Types.BigNumber>("delegate.voteBalance")
            .comparedTo(a.getAttribute<Types.BigNumber>("delegate.voteBalance")),
    );

    AppUtils.sortBy(delegateWallets, (wallet) => wallet.publicKey).forEach((delegate, i) => {
        const wallet = walletRepository.findByPublicKey(delegate.publicKey!);
        wallet.setAttribute("delegate.rank", i + 1);

        walletRepository.index(wallet);
    });
};
