import { app } from "@arkecosystem/core-container";
import { Blockchain } from "@arkecosystem/core-interfaces";
import { config as localConfig } from "../../config";

const config = app.getConfig();

export const getHeaders = () => {
    const headers = {
        nethash: config.get("network.nethash"),
        milestoneHash: config.get("milestoneHash"),
        version: app.getVersion(),
        port: localConfig.get("port"),
        os: require("os").platform(),
        height: null,
    };

    if (config.get("network.name") !== "mainnet") {
        (headers as any).hashid = app.getHashid();
    }

    const blockchain = app.resolvePlugin<Blockchain.IBlockchain>("blockchain");
    if (blockchain) {
        const lastBlock = blockchain.getLastBlock();
        if (lastBlock) {
            headers.height = lastBlock.data.height;
        }
    }

    return headers;
};
