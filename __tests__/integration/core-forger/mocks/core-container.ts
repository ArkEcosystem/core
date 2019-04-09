jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    get: () => ({}),
                };
            },
            getVersion: () => "2.3.0",
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
            resolveOptions: name => {
                return {};
            },
            has: name => {
                return false;
            },
        },
    };
});
