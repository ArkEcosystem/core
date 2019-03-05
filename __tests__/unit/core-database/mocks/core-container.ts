jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    get: () => ({}),
                    getMilestone: () => ({
                        activeDelegates: 51,
                    }),
                };
            },
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
                    return {
                        on: jest.fn(),
                        emit: jest.fn(),
                        once: jest.fn(),
                    };
                }

                return {};
            },
        },
    };
});
