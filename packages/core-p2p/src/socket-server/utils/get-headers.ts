import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";

export const getHeaders = () => {
    const resolveApiPort = (): number => {
        const options = app.has("api") ? app.resolveOptions("api") : {};
        return options.enabled ? options.port : undefined;
    };

    const headers = {
        nethash: app.getConfig().get("network.nethash"),
        version: app.getVersion(),
        port: app.resolveOptions("p2p").port,
        apiPort: resolveApiPort(),
        os: require("os").platform(),
        height: undefined,
    };

    if (app.has("blockchain")) {
        const lastBlock = app.resolvePlugin<Blockchain.IBlockchain>("blockchain").getLastBlock();

        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }

    return headers;
};
