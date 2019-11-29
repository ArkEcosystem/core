import { Blocks, Interfaces, Managers } from "@arkecosystem/crypto";
import { database } from "./database";
import { p2p } from "./p2p";
import { transactionPool } from "./transactionPool";

Managers.configManager.getMilestone().aip11 = false;
const genesisBlock: Interfaces.IBlock = Blocks.BlockFactory.fromJson(Managers.configManager.get("genesisBlock"));
Managers.configManager.getMilestone().aip11 = false;

export const blockchain = {
    queue: {
        length: () => 0,
        push: () => undefined,
        clear: () => undefined,
        idle: () => undefined,
        resume: () => undefined,
    },
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
        getLastBlock: () => genesisBlock,
    },
};
