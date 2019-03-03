import { genesisBlock } from "../fixtures/block";

jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    get: () => ({}),
                };
            },
            getVersion: () => "2.3.0",
            getHashid: () => "hashid",
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
