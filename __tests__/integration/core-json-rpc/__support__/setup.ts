import { app } from "@arkecosystem/core-container";
import { registerWithContainer, setUpContainer } from "../../../utils/helpers/container";

jest.setTimeout(60000);

const options = {
    enabled: true,
    host: "0.0.0.0",
    port: 8080,
    allowRemote: false,
    whitelist: ["127.0.0.1", "::ffff:127.0.0.1"],
};

export async function setUp() {
    // @ts-ignore
    process.env.CORE_JSON_RPC_ENABLED = true;
    process.env.DISABLE_P2P_SERVER = "true"; // no need for p2p server here
    process.env.CORE_PATH_CACHE = new Date().toISOString(); // cached peers can mess with tests so we give a different path every time

    await setUpContainer({
        exclude: ["@arkecosystem/core-webhooks", "@arkecosystem/core-forger", "@arkecosystem/core-json-rpc"],
    });

    const { plugin } = require("../../../../packages/core-json-rpc/src");
    await registerWithContainer(plugin, options);

    return app;
}

export async function tearDown() {
    await app.tearDown();

    const { plugin } = require("../../../../packages/core-json-rpc/src");
    await plugin.deregister(app, options);

    await app.tearDown();
}
