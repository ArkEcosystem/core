export const state = {
    getStore: () => ({
        cacheTransactions: () => undefined,
        getLastBlock: () => ({ data: { height: 0 } }),
        getLastHeight: () => 1,
        clearCachedTransactionIds: () => undefined,
    }),
};
