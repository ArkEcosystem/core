import { blockchain } from "./blockchain";
import { config } from "./config";
import { database } from "./database";
import { logger } from "./logger";
import { p2p } from "./p2p";
import { state } from "./state";
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
                    epoch: "2017-03-21T13:00:00.000Z",
                }),
            };
        },
        resolvePlugin: name => {
            switch (name) {
                case "logger":
                    return logger;
                case "blockchain":
                    return blockchain;
                case "event-emitter":
                    return {
                        emit: () => ({}),
                        once: () => ({}),
                    };
                case "database":
                    return database;
                case "p2p":
                    return p2p;
                case "transaction-pool":
                    return transactionPool;
                case "state":
                    return state;
                default:
                    return undefined;
            }
        },
        resolveOptions: () => ({}),
        has: () => false,
        forceExit: () => undefined,
    },
};
