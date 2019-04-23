import { database } from "./database";
import { state } from "./state";

export const container = {
    app: {
        getConfig: () => {
            return {
                get: () => ({}),
            };
        },
        resolve: name => {
            if (name === "state") {
                return state;
            }

            return {};
        },
        resolvePlugin: name => {
            if (name === "logger") {
                return {
                    info: console.log,
                    warn: console.log,
                    error: console.error,
                    debug: console.log,
                };
            }

            if (name === "blockchain") {
                return {
                    getLastBlock: () => ({
                        data: {
                            height: 20,
                        },
                    }),
                };
            }

            if (name === "event-emitter") {
                return {
                    emit: () => ({}),
                };
            }

            if (name === "database") {
                return database;
            }

            return {};
        },
        resolveOptions: () => ({}),
    },
};

jest.mock("@arkecosystem/core-container", () => container);
