export const database = {
    restoredDatabaseIntegrity: true,

    walletManager: {
        findByPublicKey: pubKey => "username",
    },

    commitQueuedQueries: () => undefined,
    buildWallets: () => undefined,
    saveWallets: () => undefined,
    getLastBlock: async () => ({ data: { height: 1 } }),
    saveBlock: () => undefined,
    saveBlocks: () => undefined,
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
