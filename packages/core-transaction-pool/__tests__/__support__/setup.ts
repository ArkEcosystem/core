import { app } from "@arkecosystem/core-kernel";
import delay from "delay";
import { registerWithContainer, setUpContainer } from "../../../core-test-utils/src/helpers/container";

jest.setTimeout(60000);

const options = {
    enabled: true,
    maxTransactionsPerSender: 300,
    allowedSenders: [],
    dynamicFees: {
        enabled: true,
        minFeePool: 1000,
        minFeeBroadcast: 1000,
        addonBytes: {
            transfer: 100,
            secondSignature: 250,
            delegateRegistration: 400000,
            vote: 100,
            multiSignature: 500,
            ipfs: 250,
            timelockTransfer: 500,
            multiPayment: 500,
            delegateResignation: 400000,
        },
    },
};

export const setUp = async () => {
    return await setUpContainer({
        exit: "@arkecosystem/core-blockchain",
        exclude: ["@arkecosystem/core-transaction-pool"],
        network: "unitnet",
    });
};

export const setUpFull = async () => {
    await setUpContainer({
        exit: "@arkecosystem/core-transaction-pool",
        exclude: ["@arkecosystem/core-transaction-pool"],
        network: "unitnet",
    });

    const { plugin } = require("../../src/plugin");
    await registerWithContainer(plugin, options);

    // now registering the plugins that need to be registered after transaction pool
    // register p2p
    const { plugin: pluginP2p } = require("@arkecosystem/core-p2p");
    await registerWithContainer(pluginP2p, {
        host: "0.0.0.0",
        port: 4000,
        minimumNetworkReach: 5,
        coldStart: 5,
    });

    // register blockchain
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

    return app;
};

export const tearDown = async () => {
    await app.tearDown();
};

export const tearDownFull = async () => {
    const { plugin: pluginP2p } = require("@arkecosystem/core-p2p");
    await pluginP2p.deregister(app, {});

    const { plugin } = require("../../src/plugin");
    await plugin.deregister(app, options);

    await app.tearDown();
};
