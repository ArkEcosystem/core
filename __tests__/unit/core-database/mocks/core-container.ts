import { stateStorageStub } from "../__fixtures__/state-storage-stub";
import { emitter } from "./emitter";

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    config: { milestones: [{ activeDelegates: 51, height: 1 }] },
                    get: () => ({}),
                    getMilestone: () => ({
                        activeDelegates: 51,
                    }),
                };
            },
            has: () => true,
            resolve: () => ({}),
            resolvePlugin: name => {
                if (name === "logger") {
                    return {
                        info: jest.fn(),
                        warn: jest.fn(),
                        error: jest.fn(),
                        debug: jest.fn(),
                    };
                }

                if (name === "event-emitter") {
                    return emitter;
                }

                if (name === "state") {
                    return { getStore: () => stateStorageStub };
                }

                return {};
            },
        },
    };
});
