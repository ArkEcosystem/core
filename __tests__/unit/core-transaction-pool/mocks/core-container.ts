jest.mock("@arkecosystem/core-container", () => {
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

                if (name === "blockchain") {
                    return {
                        getLastBlock: () => ({
                            data: {
                                height: 20,
                            },
                        }),
                    };
                }

                return {};
            },
        },
    };
});
