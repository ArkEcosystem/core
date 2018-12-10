import { app } from "@arkecosystem/core-container";
import { transformPlugins } from "../transformers/plugins";

const appConfig = app.resolvePlugin("config");

export const config = {
    async handler(request, h) {
        return {
            data: {
                version: app.getVersion(),
                network: {
                    version: appConfig.network.pubKeyHash,
                    nethash: appConfig.network.nethash,
                    explorer: appConfig.network.client.explorer,
                    token: {
                        name: appConfig.network.client.token,
                        symbol: appConfig.network.client.symbol,
                    },
                },
                plugins: transformPlugins(appConfig),
            },
        };
    },
    config: {
        cors: true,
    },
};

export const network = {
    handler(request, h) {
        return {
            data: require(`${process.env.ARK_PATH_CONFIG}/network.json`),
        };
    },
};

export const genesisBlock = {
    handler(request, h) {
        return {
            data: require(`${process.env.ARK_PATH_CONFIG}/genesisBlock.json`),
        };
    },
};

export const peers = {
    handler(request, h) {
        return {
            data: require(`${process.env.ARK_PATH_CONFIG}/peers.json`),
        };
    },
};

export const delegates = {
    handler(request, h) {
        const data = require(`${process.env.ARK_PATH_CONFIG}/delegates.json`);
        data.secrets = [];
        delete data.bip38;

        return { data };
    },
};
