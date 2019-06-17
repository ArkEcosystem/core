export const database = {
    restoredDatabaseIntegrity: true,

    walletManager: {
        findByPublicKey: pubKey => "username",
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
    getBlock: () => undefined,
    revertBlock: () => undefined,
    applyBlock: () => undefined,
    getForgedTransactionsIds: () => [],
};
