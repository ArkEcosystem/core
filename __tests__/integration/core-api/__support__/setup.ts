import { app } from "@arkecosystem/core-container";
import { Database, State } from "@arkecosystem/core-interfaces";
import { Utils } from "@arkecosystem/crypto";
import delay from "delay";
import { defaults } from "../../../../packages/core-api/src/defaults";
import { plugin } from "../../../../packages/core-api/src/plugin";
import { defaults as defaultsPeer } from "../../../../packages/core-p2p/src/defaults";
import { registerWithContainer, setUpContainer } from "../../../utils/helpers/container";

import { delegates } from "../../../utils/fixtures";
import { generateRound } from "./utils/generate-round";

import { sortBy } from "@arkecosystem/utils";
import { asValue } from "awilix";

const round = generateRound(delegates.map(delegate => delegate.publicKey), 1);

const options = {
    enabled: true,
    host: "0.0.0.0",
    port: 4003,
    whitelist: ["*"],
};

const setUp = async () => {
    jest.setTimeout(60000);

    process.env.DISABLE_P2P_SERVER = "true"; // no need for p2p socket server to run
    process.env.CORE_RESET_DATABASE = "1";

    await setUpContainer({
        exclude: [
            "@arkecosystem/core-webhooks",
            "@arkecosystem/core-forger",
            "@arkecosystem/core-exchange-json-rpc",
            "@arkecosystem/core-api",
        ],
    });

    app.register("pkg.p2p.opts", asValue(defaultsPeer));

    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    await databaseService.buildWallets();
    await databaseService.saveRound(round);

    app.register("pkg.api.opts", asValue({ ...defaults, ...options }));

    await registerWithContainer(plugin, options);
    await delay(1000); // give some more time for api server to be up
};

const tearDown = async () => {
    await app.tearDown();

    await plugin.deregister(app, options);
};

const calculateRanks = async () => {
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const delegateWallets = Object.values(databaseService.walletManager.allByUsername()).sort(
        (a: State.IWallet, b: State.IWallet) =>
            b
                .getAttribute<Utils.BigNumber>("delegate.voteBalance")
                .comparedTo(a.getAttribute<Utils.BigNumber>("delegate.voteBalance")),
    );

    for (const delegate of sortBy(delegateWallets, "publicKey")) {
        const wallet = databaseService.walletManager.findByPublicKey(delegate.publicKey);
        wallet.setAttribute("delegate.rank", delegateWallets.indexOf(delegate) + 1);

        databaseService.walletManager.reindex(wallet);
    }
};

export { calculateRanks, setUp, tearDown };
