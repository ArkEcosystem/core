import { app } from "@arkecosystem/core-kernel";
import { setUpContainer } from "@arkecosystem/core-test-utils/src/helpers/container";
import { defaults } from "../../src/defaults";
import { startServer } from "../../src/server";

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
