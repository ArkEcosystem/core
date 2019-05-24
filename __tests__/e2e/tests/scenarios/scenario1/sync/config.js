"use strict";

/*
Test summary :
We want to test sync : we use the node that was not started yet, to start it and verify :
- it has synced and has the last block
- it was added as a peer by other nodes

Workflow :
- when sync is done : we verify that all peers are in sync
*/

module.exports = {
    events: {
        nodesSynced: {
            done: ["1.check-sync.test"],
            timeLimit: 1000 * 60 * 60 * 20 // 20 hours (testing with this value for now, no idea how long mainnet will take)
        },
    },
};
