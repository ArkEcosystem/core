import { ITransaction } from "@packages/crypto/src/interfaces";

let mockTransaction: ITransaction | null;

export const setMockTransaction = (transaction: ITransaction | null) => {
    mockTransaction = transaction;
};

export const transactionRepository = {
    findByIds: async () => {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    findByType: async () => {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    findReceivedTransactions() {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    getOpenHtlcLocks() {
        return mockTransaction ? [mockTransaction.data] : [];
    },
    getClaimedHtlcLockBalances() {
        return mockTransaction
            ? [{ claimedBalance: mockTransaction.data.amount, recipientId: mockTransaction.data.recipientId }]
            : [];
    },
    getRefundedHtlcLockBalances() {
        return mockTransaction
            ? [{ refundedBalance: mockTransaction.data.amount, senderPublicKey: mockTransaction.data.senderPublicKey }]
            : [];
    },
};
