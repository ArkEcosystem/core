"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xstate_1 = require("xstate");
const sync_with_network_1 = require("./actions/sync-with-network");
exports.blockchainMachine = xstate_1.Machine({
    key: "blockchain",
    initial: "uninitialised",
    states: {
        uninitialised: {
            on: {
                START: "init",
                STOP: "stopped",
            },
        },
        init: {
            onEntry: ["init"],
            on: {
                NETWORKSTART: "idle",
                STARTED: "syncWithNetwork",
                ROLLBACK: "rollback",
                FAILURE: "exit",
                STOP: "stopped",
            },
        },
        syncWithNetwork: {
            on: {
                TEST: "idle",
                SYNCFINISHED: "idle",
                FORK: "fork",
                STOP: "stopped",
            },
            ...sync_with_network_1.syncWithNetwork,
        },
        idle: {
            onEntry: ["checkLater", "blockchainReady"],
            on: {
                WAKEUP: "syncWithNetwork",
                NEWBLOCK: "newBlock",
                STOP: "stopped",
                FORK: "fork",
            },
        },
        newBlock: {
            on: {
                PROCESSFINISHED: "idle",
                FORK: "fork",
                STOP: "stopped",
            },
        },
        fork: {
            onEntry: ["startForkRecovery"],
            on: {
                SUCCESS: "syncWithNetwork",
                FAILURE: "exit",
                STOP: "stopped",
            },
        },
        rollback: {
            onEntry: ["rollbackDatabase"],
            on: {
                SUCCESS: "init",
                FAILURE: "exit",
                STOP: "stopped",
            },
        },
        /**
         * This state should be used for stopping the blockchain on purpose, not as
         * a result of critical errors. In those cases, using the `exit` state would
         * be a better option
         */
        stopped: {
            onEntry: ["stopped"],
        },
        exit: {
            onEntry: ["exitApp"],
        },
    },
});
//# sourceMappingURL=blockchain.js.map