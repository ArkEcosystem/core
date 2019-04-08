import { configManager } from "@arkecosystem/crypto";
import { blocks2to100 } from "../../../utils/fixtures";
import { delegates } from "../../../utils/fixtures/testnet/delegates";
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
                    config: { milestones: [{ activeDelegates: 51, height: 1 }] },
                    getMilestone: () => ({
                        activeDelegates: 51,
                    }),
                };
            },
            getVersion: () => "2.3.0",
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
                        getActiveDelegates: height => {
                            return delegates;
                        },
                        loadActiveDelegateList: (count, height) => {
                            if (height === 2) {
                                return [blocks2to100[1]];
                            }

                            return delegates;
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
