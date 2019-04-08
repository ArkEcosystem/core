import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";

export const getHeaders = () => {
    const headers = {
        nethash: app.getConfig().get("network.nethash"),
        version: app.getVersion(),
        port: app.resolveOptions("p2p").get("port"),
        os: require("os").platform(),
        height: null,
    };

    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    if (blockchain) {
        const lastBlock = blockchain.getLastBlock();
        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }

    return headers;
};
