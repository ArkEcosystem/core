import { configManager } from "@arkecosystem/crypto";
import { genesisBlock } from "../../../utils/fixtures/unitnet/block-model";
import { blockchain } from "./blockchain";
import { database } from "./database";
import { eventEmitter } from "./event-emitter";

configManager.setFromPreset("unitnet");

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    get: key => {
                        switch (key) {
                            case "network.nethash":
                                return "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348";
                        }

                        return null;
                    },
                    getMilestone: () => ({
                        activeDelegates: 51,
                        blocktime: 8,
                        reward: 0,
                        block: {
                            maxTransactions: 200,
                        },
                    }),
                };
            },
            getVersion: () => "2.3.0",
            getHashid: () => "hashid",
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
                    return database;
                }

                if (name === "event-emitter") {
                    return eventEmitter;
                }

                if (name === "blockchain") {
                    return blockchain;
                }

                if (name === "p2p") {
                    return {
                        guard: {},
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
            resolveOptions: name => {
                if (name === "transactionPool") {
                    return null;
                }

                return {};
            },
        },
    };
});
