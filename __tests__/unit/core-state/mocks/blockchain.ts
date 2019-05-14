import { database } from "./database";
import { p2p } from "./p2p";
import { transactionPool } from "./transactionPool";

export const blockchain = {
    queue: { length: () => 0, push: () => undefined, clear: () => undefined },
    isStopped: false,

    setWakeUp: () => undefined,
    dispatch: () => undefined,
    isSynced: () => true,
    isRebuildSynced: () => true,
    enqueueBlocks: () => undefined,
    clearAndStopQueue: () => undefined,
    removeBlocks: () => undefined,
    removeTopBlocks: () => undefined,
    processBlock: () => undefined,
    rebuildBlock: () => undefined,
    forkBlock: () => undefined,
    resetLastDownloadedBlock: () => undefined,
    getLastBlock: () => undefined,
    clearQueue: () => undefined,

    p2p,
    database,
    transactionPool,
    state: {
        forkedBlock: undefined,
        setLastBlock: () => undefined,
    },
};
