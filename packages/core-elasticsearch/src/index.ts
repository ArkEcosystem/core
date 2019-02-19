import { Container, Logger } from "@arkecosystem/core-interfaces";
import { defaults } from "./defaults";
import { blockIndex } from "./index/block";
import { roundIndex } from "./index/round";
import { transactionIndex } from "./index/transaction";
import { walletIndex } from "./index/wallet";
import { startServer } from "./server";
import { client } from "./services/client";
import { storage } from "./services/storage";

export const plugin: Container.PluginDescriptor = {
    pkg: require("../package.json"),
    defaults,
    alias: "elasticsearch",
    async register(container: Container.IContainer, options) {
        storage.ensure();

        await client.setUp(options.client);

        blockIndex.setUp(options.chunkSize);
        transactionIndex.setUp(options.chunkSize);
        walletIndex.setUp(options.chunkSize);
        roundIndex.setUp(options.chunkSize);

        return startServer(options.server);
    },
    async deregister(container: Container.IContainer, options) {
        return container.resolvePlugin("elasticsearch").stop();
    },
};
