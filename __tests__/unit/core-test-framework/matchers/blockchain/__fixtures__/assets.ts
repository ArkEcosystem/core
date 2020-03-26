export const machineConfig = {
    key: "blockchain",
    initial: "uninitialised",
    states: {
        uninitialised: {
            on: {
                STOP: "stopped",
            },
        },
        stopped: {
            onEntry: ["stopped"],
        },
        nestedState: {
            states: {
                firstNestedState: {
                    onEntry: ["runFirstNestedState"],
                    on: {
                        LEAVE: "secondNestedState",
                    },
                },
                secondNestedState: {
                    onEntry: ["runSecondNestedState"],
                    on: {
                        LEAVE: "stopped",
                    },
                },
            },
        },
    },
};
