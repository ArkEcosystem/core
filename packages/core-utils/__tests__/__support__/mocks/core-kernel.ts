jest.mock("@arkecosystem/core-kernel", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    getMilestone: () => ({
                        epoch: "2017-03-21T13:00:00.000Z",
                        activeDelegates: 51,
                    }),
                };
            },
        },
    };
});
