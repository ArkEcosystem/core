import { configManager } from "@arkecosystem/crypto";
import { genesisBlock } from "../../../utils/fixtures/unitnet/block-model";

configManager.setFromPreset("testnet");

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    get: key => {
                        if (key === "network.nethash") {
                            return configManager.get("nethash");
                        }

                        return null;
                    },
                };
            },
            getVersion: () => "2.3.0",
            getHashid: () => "hashid",
            has: () => true,
            resolvePlugin: name => {
                if (name === "logger") {
                    return {
                        info: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn(),
                        debug: jest.fn(),
                    };
                }

                if (name === "database") {
                    return {
                        getBlocksByHeight: heights => {
                            if (heights[0] === 1) {
                                return [genesisBlock.data];
                            }

                            return [];
                        },
                    };
                }

                if (name === "event-emitter") {
                    return {
                        emit: jest.fn(),
                    };
                }

                return {};
            },
            resolve: name => {
                if (name === "state") {
                    return {
                        getLastBlock: () => genesisBlock,
                    };
                }

                return {};
            },
        },
    };
});
