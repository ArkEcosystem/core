import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";

export const getHeaders = () => {
    const resolvePorts = (): { port: number; apiPort?: number; walletApiPort?: number } => {
        const port = app.resolveOptions("p2p").port;
        const apiOptions = app.has("api") ? app.resolveOptions("api") : {};
        const apiPort = apiOptions.enabled ? apiOptions.port : undefined;
        const walletApiPort = app.has("wallet-api") ? app.resolveOptions("wallet-api").port : undefined;

        return { port, apiPort, walletApiPort };
    };

    const headers = {
        nethash: app.getConfig().get("network.nethash"),
        version: app.getVersion(),
        ...resolvePorts(),
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
