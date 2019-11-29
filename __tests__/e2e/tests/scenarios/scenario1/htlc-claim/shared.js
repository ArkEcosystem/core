const transactions = {
    lockTransactions: { // this will be filled by 1.create-lock-txs
        normal: {},
        wrongSecret: {},
        notRecipient: {},
        lockExpired: {}
    },
    claimTransactions: { // this will be filled by 2.create-claim-txs
        normal: {},
        wrongSecret: {},
        notRecipient: {},
        lockExpired: {}
    },
}

module.exports = transactions;