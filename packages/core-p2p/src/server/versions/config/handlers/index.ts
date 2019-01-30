import { app } from "@arkecosystem/core-kernel";
import { transformPlugins } from "../transformers/plugins";

const appConfig = app.getConfig();

export const config = {
    async handler(request, h) {
        return {
            data: {
                version: app.version(),
                network: {
                    version: appConfig.get("network.pubKeyHash"),
                    name: appConfig.get("network.name"),
                    nethash: appConfig.get("network.nethash"),
                    explorer: appConfig.get("network.client.explorer"),
                    token: {
                        name: appConfig.get("network.client.token"),
                        symbol: appConfig.get("network.client.symbol"),
                    },
                },
                plugins: transformPlugins(appConfig.config),
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
            data: require(`${process.env.CORE_PATH_CONFIG}/network.json`),
        };
    },
};

export const exceptions = {
    handler(request, h) {
        return {
            data: require(`${process.env.CORE_PATH_CONFIG}/exceptions.json`),
        };
    },
};

export const milestones = {
    handler(request, h) {
        return {
            data: require(`${process.env.CORE_PATH_CONFIG}/milestones.json`),
        };
    },
};

export const genesisBlock = {
    handler(request, h) {
        return {
            data: require(`${process.env.CORE_PATH_CONFIG}/genesisBlock.json`),
        };
    },
};

export const peers = {
    handler(request, h) {
        return {
            data: require(`${process.env.CORE_PATH_CONFIG}/peers.json`),
        };
    },
};

export const delegates = {
    handler(request, h) {
        const data = require(`${process.env.CORE_PATH_CONFIG}/delegates.json`);
        data.secrets = [];
        delete data.bip38;

        return { data };
    },
};
