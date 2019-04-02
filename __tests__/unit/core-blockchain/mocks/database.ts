export const database = {
    restoredDatabaseIntegrity: true,

    walletManager: {
        findByPublicKey: pubKey => "username",
    },

    commitQueuedQueries: () => null,
    buildWallets: () => null,
    saveWallets: () => null,
    getLastBlock: () => null,
    saveBlock: () => null,
    verifyBlockchain: () => ({ valid: true }),
    deleteRound: () => null,
    applyRound: () => null,
    getActiveDelegates: () => [],
    restoreCurrentRound: () => null,
    enqueueDeleteBlock: () => null,
    getBlocks: () => [],
    getBlock: () => null,
    revertBlock: () => null,
    applyBlock: () => null,
    getForgedTransactionsIds: () => [],
};
