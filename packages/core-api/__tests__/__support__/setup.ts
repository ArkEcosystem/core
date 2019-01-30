import { PostgresConnection } from "@arkecosystem/core-database-postgres";
import { app } from "@arkecosystem/core-kernel";
import delay from "delay";
import { registerWithContainer, setUpContainer } from "../../../core-test-utils/src/helpers/container";
import { plugin } from "../../src/plugin";

import { delegates } from "../../../core-test-utils/src/fixtures";
import { generateRound } from "./utils/generate-round";

import { queries } from "../../../core-database-postgres/src/queries";

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

    const connection = app.resolve<PostgresConnection>("database");
    await connection.db.rounds.truncate();
    await connection.buildWallets(1);
    await connection.saveWallets(true);
    await connection.saveRound(round);

    await registerWithContainer(plugin, options);
    await delay(1000); // give some more time for api server to be up
}

async function tearDown() {
    await app.tearDown();

    await plugin.deregister(app, options);
}

async function calculateRanks() {
    const connection = app.resolve<PostgresConnection>("database");

    const rows = await connection.query.manyOrNone(queries.spv.delegatesRanks);

    rows.forEach((delegate, i) => {
        const wallet = connection.walletManager.findByPublicKey(delegate.publicKey);
        wallet.missedBlocks = +delegate.missedBlocks;
        wallet.rate = i + 1;

        connection.walletManager.reindex(wallet);
    });
}

export { calculateRanks, setUp, tearDown };
