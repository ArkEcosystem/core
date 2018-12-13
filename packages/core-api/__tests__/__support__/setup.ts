import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";

import { delegates } from "../../../core-test-utils/src/fixtures/testnet/delegates";
import { generateRound } from "./utils/generate-round";

import { queries } from "../../../core-database-postgres/src/queries";

const round = generateRound(delegates.map(delegate => delegate.publicKey), 1);

async function setUp() {
    jest.setTimeout(60000);

    await setUpContainer({
        exclude: [
            "@arkecosystem/core-webhooks",
            "@arkecosystem/core-graphql",
            "@arkecosystem/core-forger",
            "@arkecosystem/core-json-rpc",
        ],
    });

    const connection = app.resolvePlugin("database");
    await connection.db.rounds.truncate();
    await connection.buildWallets(1);
    await connection.saveWallets(true);
    await connection.saveRound(round);
}

async function tearDown() {
    await app.tearDown();
}

async function calculateRanks() {
    const connection = app.resolvePlugin("database");

    const rows = await connection.query.manyOrNone(queries.spv.delegatesRanks);

    rows.forEach((delegate, i) => {
        const wallet = connection.walletManager.findByPublicKey(delegate.publicKey);
        wallet.missedBlocks = +delegate.missedBlocks;
        wallet.rate = i + 1;

        connection.walletManager.reindex(wallet);
    });
}

export { calculateRanks, setUp, tearDown };
