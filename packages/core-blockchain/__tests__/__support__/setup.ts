import { app } from "@arkecosystem/core-kernel";
import { registerWithContainer, setUpContainer } from "../../../core-test-utils/src/helpers/container";

jest.setTimeout(60000);

export const setUpFull = async () => {
    await setUpContainer({
        exit: "@arkecosystem/core-p2p",
        exclude: ["@arkecosystem/core-blockchain"],
    });

    const { plugin } = require("../../src/plugin");
    await registerWithContainer(plugin, {});

    return app;
};

export const tearDownFull = async () => {
    await app.tearDown();

    const { plugin } = require("../../src/plugin");
    await plugin.deregister(app, {});
};

export const setUp = async () =>
    setUpContainer({
        exit: "@arkecosystem/core-p2p",
        exclude: ["@arkecosystem/core-blockchain"],
    });

export const tearDown = async () => {
    await app.tearDown();
};
