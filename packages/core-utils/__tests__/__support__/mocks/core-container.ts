jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            resolvePlugin: name => {
                if (name === "config") {
                    return {
                        getConstants: () => ({
                            epoch: "2017-03-21T13:00:00.000Z",
                            activeDelegates: 51,
                        }),
                    };
                }

                return {};
            },
        },
    };
});
