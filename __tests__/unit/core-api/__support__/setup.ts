import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import delay from "delay";
import { plugin } from "../../../../packages/core-api/src/plugin";
import { registerWithContainer, setUpContainer } from "../../../utils/helpers/container";

import { delegates } from "../../../utils/fixtures";
import { generateRound } from "./utils/generate-round";

import { queries } from "../../../../packages/core-database-postgres/src/queries";

const round = generateRound(delegates.map(delegate => delegate.publicKey), 1);

const options = {
    enabled: true,
    host: "0.0.0.0",
    port: 4003,
    whitelist: ["*"],
};

async function setUp() {
    jest.setTimeout(60000);

    await setUpContainer({
        exclude: [
            "@arkecosystem/core-webhooks",
            "@arkecosystem/core-graphql",
            "@arkecosystem/core-forger",
            "@arkecosystem/core-json-rpc",
            "@arkecosystem/core-api",
        ],
    });

    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");
    await databaseService.connection.roundsRepository.truncate();
    await databaseService.buildWallets(1);
    await databaseService.saveRound(round);

    await registerWithContainer(plugin, options);
    await delay(1000); // give some more time for api server to be up
}

async function tearDown() {
    await app.tearDown();

    await plugin.deregister(app, options);
}

async function calculateRanks() {
    const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    const rows = await (databaseService.connection as any).query.manyOrNone(queries.spv.delegatesRanks);

    rows.forEach((delegate, i) => {
        const wallet = databaseService.walletManager.findByPublicKey(delegate.publicKey);
        wallet.missedBlocks = +delegate.missedBlocks;
        (wallet as any).rate = i + 1;

        databaseService.walletManager.reindex(wallet);
    });
}

export { calculateRanks, setUp, tearDown };
