import { app } from "@arkecosystem/core-container";
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
    process.env.CORE_ENV = "test";
    await registerWithContainer(require("../../src/plugin").plugin, options);
    await registerWithContainer(require("@arkecosystem/core-blockchain").plugin, {});
};

export const tearDown = async () => {
    await require("@arkecosystem/core-blockchain").plugin.deregister(app, {});
    await require("../../src/plugin").plugin.deregister(app, options);

    await app.tearDown();
};

export const setUpFull = async () => {
    await setUpContainer({
        exit: "@arkecosystem/core-blockchain",
    });
};

export const tearDownFull = async () => {
    await app.tearDown();
};
