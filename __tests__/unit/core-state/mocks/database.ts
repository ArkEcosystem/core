export const database = {
    restoredDatabaseIntegrity: true,

    walletManager: {
        findByPublicKey: pubKey => "username",
    },
    transactionsBusinessRepository: {
        findById: id => undefined,
    },

    buildWallets: () => undefined,
    saveWallets: () => undefined,
    getLastBlock: () => undefined,
    saveBlock: () => undefined,
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
};
