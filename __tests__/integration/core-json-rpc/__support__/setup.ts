import { app } from "@arkecosystem/core-container";
import { tmpdir } from "os";
import { setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(60000);

export async function setUp() {
    // @ts-ignore
    process.env.CORE_JSON_RPC_ENABLED = true;
    process.env.DISABLE_P2P_SERVER = "true"; // no need for p2p server here
    process.env.CORE_PATH_CACHE = tmpdir();

    await setUpContainer({
        exclude: ["@arkecosystem/core-webhooks", "@arkecosystem/core-forger"],
        exit: "@arkecosystem/core-json-rpc",
    });

    return app;
}

export async function tearDown() {
    await app.tearDown();
}
