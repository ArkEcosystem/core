export const defaults = {
    enabled: !process.env.CORE_TRANSACTION_POOL_DISABLED,
    syncInterval: 512,
    storage: `${process.env.CORE_PATH_DATA}/database/transaction-pool-${process.env.CORE_NETWORK_NAME}.sqlite`,
    // When the pool contains that many transactions, then a new transaction is
    // only accepted if its fee is higher than the transaction with the lowest
    // fee in the pool. In this case the transaction with the lowest fee is removed
    // from the pool in order to accommodate the new one.
    maxTransactionsInPool: process.env.CORE_MAX_TRANSACTIONS_IN_POOL || 100000,
    maxTransactionsPerSender: process.env.CORE_TRANSACTION_POOL_MAX_PER_SENDER || 300,
    allowedSenders: [],
    maxTransactionsPerRequest: process.env.CORE_TRANSACTION_POOL_MAX_PER_REQUEST || 40,
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
            timelockTransfer: 500,
            multiPayment: 500,
            delegateResignation: 400000,
        },
    },
};
