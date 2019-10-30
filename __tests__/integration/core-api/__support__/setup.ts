import { app, Contracts, Container, Utils as AppUtils } from "@arkecosystem/core-kernel";
import { Utils } from "@arkecosystem/crypto";
import { resolve } from "path";

// import { generateRound } from "./utils/generate-round";
// import { delegates } from "@packages/core-test-framework/src/utils/fixtures";

export const setUp = async () => {
    jest.setTimeout(60000);

    process.env.DISABLE_P2P_SERVER = "true"; // no need for p2p socket server to run
    process.env.CORE_RESET_DATABASE = "1";

    process.env.CORE_PATH_CONFIG = resolve(__dirname, "../../../../packages/core-test-framework/src/utils/config");

    await app.bootstrap({
        flags: {
            token: "ark",
            network: "unitnet",
            env: "test",
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
};

export const tearDown = async () => await app.terminate();

export const calculateRanks = async () => {
    const databaseService = app.get<Contracts.Database.DatabaseService>(Container.Identifiers.DatabaseService);

    const delegateWallets = Object.values(databaseService.walletRepository.allByUsername()).sort(
        (a: Contracts.State.Wallet, b: Contracts.State.Wallet) =>
            b
                .getAttribute<Utils.BigNumber>("delegate.voteBalance")
                .comparedTo(a.getAttribute<Utils.BigNumber>("delegate.voteBalance")),
    );

    AppUtils.sortBy(delegateWallets, wallet => wallet.publicKey).forEach((delegate, i) => {
        const wallet = databaseService.walletRepository.findByPublicKey(delegate.publicKey);
        wallet.setAttribute("delegate.rank", i + 1);

        databaseService.walletRepository.reindex(wallet);
    });
};
