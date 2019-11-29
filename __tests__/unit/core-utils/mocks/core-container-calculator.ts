jest.mock("@arkecosystem/core-container", () => {
    return {
        app: {
            getConfig: () => {
                return {
                    get: () => 1000000 * 1e8,
                    getMilestone: () => ({
                        height: 1,
                        reward: 2 * 1e8,
                    }),
                    genesisBlock: {
                        totalAmount: 1000000 * 1e8,
                    },
                    all: () => ({
                        genesisBlock: { totalAmount: 1000000 * 1e8 },
                        milestones: [{ height: 1, reward: 2 * 1e8 }],
                    }),
                };
            },
            resolvePlugin: name => {
                if (name === "config") {
                    return {
                        getMilestone: () => ({
                            height: 1,
                            reward: 2 * 1e8,
                        }),
                        genesisBlock: {
                            totalAmount: 1000000 * 1e8,
                        },
                    };
                }

                if (name === "blockchain") {
                    return {
                        getLastBlock: () => ({
                            data: { height: 1 },
                        }),
                    };
                }

                return {};
            },
        },
    };
});
