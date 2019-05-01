export const database = {
    restoredDatabaseIntegrity: true,

    walletManager: {
        findByPublicKey: pubKey => "username",
    },

    commitQueuedQueries: () => undefined,
    buildWallets: () => undefined,
    saveWallets: () => undefined,
    getLastBlock: () => undefined,
    saveBlock: () => undefined,
    verifyBlockchain: () => true,
    deleteRound: () => undefined,
    applyRound: () => undefined,
    getActiveDelegates: () => [],
    restoreCurrentRound: () => undefined,
    enqueueDeleteBlock: () => undefined,
    getBlocks: () => [],
    getBlock: () => undefined,
    revertBlock: () => undefined,
    applyBlock: () => undefined,
    getForgedTransactionsIds: () => [],
};
