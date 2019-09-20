module.exports = {
    cli: {
        forger: {
            run: {
                plugins: {
                    include: ["@arkecosystem/core-forger"],
                },
            },
        },
        relay: {
            run: {
                plugins: {
                    exclude: ["@arkecosystem/core-forger"],
                },
            },
        },
    },
};
