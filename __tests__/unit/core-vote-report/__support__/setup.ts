import { app } from "@arkecosystem/core-container";
import { setUpContainer } from "../../../utils/helpers/container";
import { defaults } from "../../../../packages/core-vote-report/src/defaults";
import { startServer } from "../../../../packages/core-vote-report/src/server";

jest.setTimeout(60000);

let server;
async function setUp() {
    await setUpContainer({
        exit: "@arkecosystem/core-blockchain",
    });

    server = await startServer(defaults);
}

async function tearDown() {
    await server.stop();
    await app.tearDown();
}

export { setUp, tearDown };
