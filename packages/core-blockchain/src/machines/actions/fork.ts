export const fork = {
    initial: "analysing",
    states: {
        analysing: {
            onEntry: ["analyseFork"],
            on: {
                NOFORK: "exit",
            },
        },
        network: {
            onEntry: ["checkNetwork"],
        },
        revertBlocks: {},
        exit: {
            onEntry: ["forkRecovered"],
        },
    },
};
