export const defaults = {
    storage: {
        maxLastBlocks: 100,
        maxLastTransactionIds: 10000,
    },
    walletSync: {
        enabled: !!process.env.CORE_WALLET_SYNC_ENABLED,
    },
};
