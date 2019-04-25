import { database } from "./database";
import { p2p } from "./p2p";
import { transactionPool } from "./transactionPool";

export const blockchain = {
    queue: { length: () => 0, push: () => null, clear: () => null },
    isStopped: false,

    setWakeUp: () => null,
    dispatch: () => null,
    isSynced: () => true,
    isRebuildSynced: () => true,
    enqueueBlocks: () => null,
    clearAndStopQueue: () => null,
    removeBlocks: () => null,
    removeTopBlocks: () => null,
    processBlock: () => null,
    rebuildBlock: () => null,
    forkBlock: () => null,
    resetLastDownloadedBlock: () => null,
    getLastBlock: () => null,
    clearQueue: () => null,

    p2p,
    database,
    transactionPool,
    state: {
        forkedBlock: null,
        setLastBlock: () => null,
    },
};
