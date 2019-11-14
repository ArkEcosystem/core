import { Contracts, Container, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Sandbox } from "@arkecosystem/core-test-framework";
import { Utils } from "@arkecosystem/crypto";

const sandbox: Sandbox = new Sandbox();

export const setUp = async () => {
    jest.setTimeout(60000);

    process.env.DISABLE_P2P_SERVER = "true"; // no need for p2p socket server to run
    process.env.CORE_RESET_DATABASE = "1";

    await sandbox.setUp(async ({ app }) => {
        await app.bootstrap({
            flags: {
                token: "ark",
                network: "unitnet",
                env: "test",
                processType: "core",
            },
            plugins: {
                exclude: [
                    // "@arkecosystem/core-api",
                    "@arkecosystem/core-forger",
                    "@arkecosystem/core-webhooks",
                ],
                options: {
                    "@arkecosystem/core-blockchain": {
                        networkStart: true,
                    },
                },
            },
        });

        await app.boot();

        await AppUtils.sleep(1000); // give some more time for api server to be up
    });

    return sandbox.app;
};

export const tearDown = async () => sandbox.tearDown();

export const calculateRanks = async () => {
    const databaseService = sandbox.app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);

    const delegateWallets = Object.values(
        databaseService.walletRepository.allByUsername(),
    ).sort((a: Contracts.State.Wallet, b: Contracts.State.Wallet) =>
        b
            .getAttribute<Utils.BigNumber>("delegate.voteBalance")
            .comparedTo(a.getAttribute<Utils.BigNumber>("delegate.voteBalance")),
    );

    AppUtils.sortBy(delegateWallets, wallet => wallet.publicKey).forEach((delegate, i) => {
        const wallet = databaseService.walletRepository.findByPublicKey(delegate.publicKey!);
        wallet.setAttribute("delegate.rank", i + 1);

        databaseService.walletRepository.reindex(wallet);
    });
};
