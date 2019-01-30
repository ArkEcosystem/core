import { app } from "@arkecosystem/core-kernel";
import delay from "delay";
import { registerWithContainer, setUpContainer } from "../../../core-test-utils/src/helpers/container";

jest.setTimeout(60000);

const options = {
    host: "0.0.0.0",
    port: 4000,
    minimumNetworkReach: 5,
    coldStart: 5,
};

export const setUp = async () => {
    await setUpContainer({
        exit: "@arkecosystem/core-p2p",
        exclude: ["@arkecosystem/core-p2p"],
    });

    // register p2p plugin
    const { plugin } = require("../../src/plugin");
    await registerWithContainer(plugin, options);

    // and now register blockchain as it has to be registered after p2p
    // a little trick here, we register blockchain plugin without starting it
    // (it caused some issues where we waited eternally for blockchain to be up)
    // instead, we start blockchain manually and check manually that it is up with getLastBlock()
    process.env.CORE_SKIP_BLOCKCHAIN = "true";
    const { plugin: pluginBlockchain } = require("@arkecosystem/core-blockchain");
    const blockchain = await registerWithContainer(pluginBlockchain, {});
    await blockchain.start(true);

    while (!blockchain.getLastBlock()) {
        await delay(1000);
    }
};

export const tearDown = async () => {
    const { plugin: pluginBlockchain } = require("@arkecosystem/core-blockchain");
    await pluginBlockchain.deregister(app, {});

    const { plugin } = require("../../src/plugin");
    await plugin.deregister(app, options);

    await app.tearDown();
};
