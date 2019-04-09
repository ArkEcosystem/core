import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";

export const getHeaders = () => {
    const headers = {
        nethash: app.getConfig().get("network.nethash"),
        version: app.getVersion(),
        port: app.resolveOptions("p2p").port,
        os: require("os").platform(),
        height: null,
    };

    if (app.has("blockchain")) {
        const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }

    return headers;
};
