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
}
