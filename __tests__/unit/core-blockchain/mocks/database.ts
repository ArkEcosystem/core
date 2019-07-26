export const database = {
    restoredDatabaseIntegrity: true,

    walletManager: {
        findByPublicKey: pubKey => ({ getAttribute: () => "username" }),
        revertBlock: () => undefined,
    },

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
    getBlocks: () => [],
    getBlocksForDownload: () => [],
    getBlock: () => undefined,
    revertBlock: () => undefined,
    applyBlock: () => undefined,
    getForgedTransactionsIds: () => [],
    loadBlocksFromCurrentRound: () => undefined,
};
