import { blockchainMachine } from "../../../../packages/core-blockchain/src/machines/blockchain";
import { stateStorageStub } from "../stubs/state-storage";
import { blockchain } from "./blockchain";
import { config } from "./config";
import { database } from "./database";
import { logger } from "./logger";
import { p2p } from "./p2p";
import { transactionPool } from "./transactionPool";

export const container = {
    app: {
        getConfig: () => {
            return {
                config: { milestones: [{ activeDelegates: 51, height: 1 }] },
                get: key => config[key],
                getMilestone: () => ({
                    activeDelegates: 51,
                    blocktime: 8000,
                }),
            };
        },
        resolve: name => {
            return {};
        },
        resolvePlugin: name => {
            if (name === "logger") {
                return logger;
            }

            if (name === "blockchain") {
                return blockchain;
            }

            if (name === "event-emitter") {
                return {
                    emit: () => ({}),
                    once: () => ({}),
                };
            }

            if (name === "database") {
                return database;
            }

            if (name === "p2p") {
                return p2p;
            }

            if (name === "transaction-pool") {
                return transactionPool;
            }

            if (name === "state") {
                stateStorageStub.blockchain = blockchainMachine.initialState;

                return { getStore: () => stateStorageStub };
            }

            return null;
        },
        resolveOptions: () => ({}),
        has: () => true,
        forceExit: () => null,
    },
};
