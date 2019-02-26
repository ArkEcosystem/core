import { app } from "@arkecosystem/core-container";
import { registerWithContainer, setUpContainer } from "../../../utils/helpers/container";

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
    await registerWithContainer(require("../../../../packages/core-p2p/src/plugin").plugin, options);
    await registerWithContainer(require("@arkecosystem/core-blockchain").plugin, {});
};

export const tearDown = async () => {
    await require("@arkecosystem/core-blockchain").plugin.deregister(app, {});
    await require("../../../../packages/core-p2p/src/plugin").plugin.deregister(app, options);

    await app.tearDown();
};
