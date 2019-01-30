jest.mock("@arkecosystem/core-kernel", () => {
    return {
        app: {
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
        },
    };
});
