module.exports = {
    cli: {
        core: {
            run: {
                plugins: {
                    include: ["@arkecosystem/core-magistrate-transactions"],
                },
            },
        },
        relay: {
            run: {
                plugins: {
                    include: ["@arkecosystem/core-magistrate-transactions"],
                },
            },
        },
        forger: {
            run: {
                plugins: {
                    include: ["@arkecosystem/core-magistrate-transactions"],
                },
            },
        },
        chain: {
            run: {
                plugins: {
                    include: ["@arkecosystem/core-magistrate-transactions"],
                },
            },
        },
        snapshot: {
            run: {
                plugins: {
                    include: ["@arkecosystem/core-magistrate-transactions"],
                },
            },
        },
    },
};
