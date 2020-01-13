import { Managers } from "@arkecosystem/crypto";
import { EventEmitter } from "../../../../packages/core-event-emitter/src/emitter";
import * as plugins from "../../../utils/config/testnet/plugins.js";
import { blocks2to100 } from "../../../utils/fixtures";
import { delegates } from "../../../utils/fixtures/testnet/delegates";
import { genesisBlock } from "../../../utils/fixtures/unitnet/block-model";
import { defaults } from "./p2p-options";

Managers.configManager.setFromPreset("unitnet");

export const eventEmitter = new EventEmitter();

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    config: {
                        plugins,
                        network: Managers.configManager.get("network"),
                        exceptions: Managers.configManager.get("exceptions"),
                        milestones: Managers.configManager.get("milestones"),
                        genesisBlock: Managers.configManager.get("genesisBlock"),
                    },
                    get: key => {
                        switch (key) {
                            case "network.nethash":
                                return "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348";
                        }

                        return Managers.configManager.get(key) || undefined;
                    },
                    getMilestone: () => ({
                        activeDelegates: 51,
                        block: {
                            maxTransactions: 500,
                        },
                    }),
                };
            },
            getVersion: () => "2.4.0",
            has: () => true,
            resolvePlugin: name => {
                if (name === "logger") {
                    return {
                        info: console.log,
                        warn: console.log,
                        error: console.error,
                        debug: console.log,
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
                        getForgedTransactionsIds: jest.fn().mockReturnValue([]),
                    };
                }

                if (name === "event-emitter") {
                    return eventEmitter;
                }

                if (name === "blockchain") {
                    return {
                        getLastBlock: jest.fn().mockReturnValue({ data: { height: 1 }, getHeader: () => ({}) }),
                        pingBlock: jest.fn().mockReturnValue(true),
                        getLastDownloadedBlock: jest.fn().mockReturnValue(undefined),
                        pushPingBlock: jest.fn().mockReturnValue(undefined),
                        handleIncomingBlock: jest.fn().mockReturnValue(undefined),
                    };
                }

                if (name === "p2p") {
                    return {};
                }

                if (name === "transaction-pool") {
                    return {
                        transactionExists: jest.fn().mockReturnValue(false),
                        hasExceededMaxTransactions: jest.fn().mockReturnValue(false),
                        addTransactions: jest.fn().mockReturnValue({ added: ["111"], notAdded: [] }),
                        walletManager: {
                            canApply: jest.fn().mockReturnValue(true),
                        },
                        makeProcessor: jest.fn().mockReturnValue({
                            validate: jest.fn().mockImplementation(() => {
                                throw new Error("The payload contains invalid transaction.");
                            }),
                        }),
                    };
                }

                if (name === "state") {
                    return {
                        getStore: () => ({
                            getLastBlock: () => genesisBlock,
                            getLastBlocks: () => [genesisBlock],
                            getLastHeight: () => genesisBlock.data.height,
                            cacheTransactions: jest.fn().mockImplementation(txs => ({ notAdded: txs, added: [] })),
                            clearCachedTransactionIds: jest.fn().mockReturnValue(undefined),
                        }),
                    };
                }

                return {};
            },
            resolveOptions: name => {
                if (name === "p2p") {
                    return defaults;
                }

                if (name === "transaction-pool") {
                    return {
                        maxTransactionsPerRequest: 30,
                    };
                }

                return {};
            },
            resolve: name => {
                return {};
            },
        },
    };
});
