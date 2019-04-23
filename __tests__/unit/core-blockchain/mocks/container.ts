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
            if (name === "state") {
                return {};
            }

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

            return null;
        },
        resolveOptions: () => ({}),
        forceExit: () => null,
    },
};
