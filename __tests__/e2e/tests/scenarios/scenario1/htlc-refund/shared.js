const transactions = {
    lockTransactions: { // this will be filled by 1.create-lock-txs
        normal: {},
        notSender: {},
        lockNotExpired: {}
    },
    refundTransactions: { // this will be filled by 2.create-refund-txs
        normal: {},
        notSender: {},
        lockNotExpired: {}
    },
}

module.exports = transactions;