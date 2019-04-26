export const state = {
    getStore: () => ({
        cacheTransactions: () => null,
        getLastBlock: () => ({ data: { height: 0 } }),
        getLastHeight: () => 1,
        removeCachedTransactionIds: () => null,
    }),
};
