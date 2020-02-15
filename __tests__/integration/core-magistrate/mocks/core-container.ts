import { EventEmitter } from "../../../../packages/core-event-emitter/src/emitter";
import { database } from "./database";
import { state } from "./state";

const eventEmitter: EventEmitter = new EventEmitter();

export const container = {
    app: {
        getConfig: () => {
            return {
                get: () => ({}),
            };
        },
        has: plugin => {
            return true;
        },
        resolve: name => {
            return {};
        },
        resolvePlugin: (name): any => {
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
                return eventEmitter;
            }

            if (name === "database") {
                return database;
            }

            if (name === "state") {
                return state;
            }

            return {};
        },
        resolveOptions: () => ({}),
    },
};

jest.mock("@arkecosystem/core-container", () => container);
