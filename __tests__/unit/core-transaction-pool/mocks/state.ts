export const state = {
    getStore: () => ({
        cacheTransactions: () => null,
        getLastBlock: () => ({ data: { height: 0 } }),
        removeCachedTransactionIds: () => null,
    }),
};
