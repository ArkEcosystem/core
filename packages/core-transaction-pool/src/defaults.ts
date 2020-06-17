export const defaults = {
    enabled: !process.env.CORE_TRANSACTION_POOL_DISABLED,
    syncInterval: 512,
    storage: `${process.env.CORE_PATH_DATA}/transaction-pool.sqlite`,
    // When the pool contains that many transactions, then a new transaction is
    // only accepted if its fee is higher than the transaction with the lowest
    // fee in the pool. In this case the transaction with the lowest fee is removed
    // from the pool in order to accommodate the new one.
    maxTransactionsInPool: process.env.CORE_MAX_TRANSACTIONS_IN_POOL || 15000,
    maxTransactionsPerSender: process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER || 150,
    allowedSenders: [],
    maxTransactionsPerRequest: process.env.CORE_TRANSACTION_POOL_MAX_PER_REQUEST || 40,
    // Max transaction age in number of blocks produced since the transaction was created.
    // If a transaction stays that long in the pool without being included in any block,
    // then it will be removed.
    maxTransactionAge: 2700,
    dynamicFees: {
        enabled: true,
        minFeePool: 3000,
        minFeeBroadcast: 3000,
        addonBytes: {
            transfer: 100,
            secondSignature: 250,
            delegateRegistration: 400000,
            vote: 100,
            multiSignature: 500,
            ipfs: 250,
            multiPayment: 500,
            delegateResignation: 100,
            htlcLock: 100,
            htlcClaim: 0,
            htlcRefund: 0,
        },
    },
};
