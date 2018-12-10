import { defaults } from "./defaults";
import { blockIndex } from "./index/block";
import { roundIndex } from "./index/round";
import { transactionIndex } from "./index/transaction";
import { walletIndex } from "./index/wallet";
import { startServer } from "./server";
import { client } from "./services/client";
import { storage } from "./services/storage";

export const plugin = {
    pkg: require("../package.json"),
    defaults,
    alias: "elasticsearch",
    async register(container, options) {
        const logger = container.resolvePlugin("logger");

        logger.info("[Elasticsearch] Initialising History :hourglass:");
        storage.ensure("history");

        logger.info("[Elasticsearch] Initialising Client :joystick:");
        await client.setUp(options.client);

        blockIndex.setUp(options.chunkSize);
        transactionIndex.setUp(options.chunkSize);
        walletIndex.setUp(options.chunkSize);
        roundIndex.setUp(options.chunkSize);

        return startServer(options.server);
    },
    async deregister(container, options) {
        container.resolvePlugin("logger").info("[Elasticsearch] Stopping API :warning:");

        return container.resolvePlugin("elasticsearch").stop();
    },
};
