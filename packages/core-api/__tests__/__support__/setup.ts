import { app } from "@arkecosystem/core-container";
import appHelper from "@arkecosystem/core-test-utils/lib/helpers/container";

import activeDelegates from "@arkecosystem/core-test-utils/fixtures/testnet/delegates";
import { generateRound } from "./utils/generate-round";

const round = generateRound(
  activeDelegates.map((delegate) => delegate.publicKey),
  1,
);

async function setUp() {
  jest.setTimeout(60000);

  await appHelper.setUp({});

  const connection = app.resolvePlugin("database");
  await connection.db.rounds.truncate();
  await connection.buildWallets(1);
  await connection.saveWallets(true);
  await connection.saveRound(round);
}

async function tearDown() {
  await tearDown();
}

export { setUp, tearDown };
