import { Managers } from "@arkecosystem/crypto";
import { EventEmitter } from "../../../../packages/core-event-emitter/src/emitter";
import { defaults } from "../../../../packages/core-p2p/src/defaults";
import * as plugins from "../../../utils/config/testnet/plugins.js";
import { blockchain } from "./blockchain";
import { database } from "./database";
import { logger } from "./logger";
import { p2p } from "./p2p";
import { state } from "./state";
import { transactionPool } from "./transaction-pool";

Managers.configManager.setFromPreset("unitnet");

const eventEmitter: EventEmitter = new EventEmitter();

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    get: key => {
                        switch (key) {
                            case "network.nethash":
                                return "a63b5a3858afbca23edefac885be74d59f1a26985548a4082f4f479e74fcc348";
                            case "peers.list":
                                return [{ ip: "1.2.3.4", port: 4000 }];
                            case "blacklist":
                                return [];
                            case "network.pubKeyHash":
                                return 23;
                            case "network.name":
                                return "unit";
                            case "network.client.explorer":
                                return "unit";
                            case "network.client.token":
                                return "T";
                            case "network.client.symbol":
                                return "T";
                        }

                        return undefined;
                    },
                    config: { milestones: [{ activeDelegates: 51, height: 1 }], plugins },
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
            getVersion: () => "2.4.0",
            has: () => true,
            resolvePlugin: name => {
                if (name === "logger") {
                    return logger;
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
                    return p2p;
                }

                if (name === "state") {
                    return state;
                }

                if (name === "transaction-pool") {
                    return transactionPool;
                }

                return {};
            },
            resolve: name => {
                return {};
            },
            resolveOptions: name => {
                if (name === "p2p") {
                    return defaults;
                }

                return {};
            },
        },
    };
});
