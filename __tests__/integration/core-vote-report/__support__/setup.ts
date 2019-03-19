import { app } from "@arkecosystem/core-container";
import { defaults } from "../../../../packages/core-vote-report/src/defaults";
import { startServer } from "../../../../packages/core-vote-report/src/server";
import { setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(60000);

let server;
export async function setUp() {
    await setUpContainer({
        exit: "@arkecosystem/core-blockchain",
    });

    server = await startServer(defaults);
}

export async function tearDown() {
    await server.stop();
    await app.tearDown();
}
