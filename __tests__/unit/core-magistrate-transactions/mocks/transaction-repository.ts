import { SearchFilter } from "@packages/core-database/src/repositories/search";
import { ITransaction } from "@packages/crypto/src/interfaces";

let mockTransaction: ITransaction | null;
let mockTransactions: [ITransaction];

export const setMockTransaction = (transaction: ITransaction | null) => {
    mockTransaction = transaction;
};

export const setMockTransactions = (transactions: [ITransaction]) => {
    mockTransactions = transactions;
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
            ? [{ amount: mockTransaction.data.amount, recipientId: mockTransaction.data.recipientId }]
            : [];
    },
    getRefundedHtlcLockBalances() {
        return mockTransaction
            ? [{ amount: mockTransaction.data.amount, senderPublicKey: mockTransaction.data.senderPublicKey }]
            : [];
    },
    search(filter: SearchFilter): any {
        const type = filter.criteria.find(x => x.field === "type");
        return {
            // @ts-ignore
            rows: mockTransactions.filter(x => x.data.type === type.value).map(x => x.data),
        };
    },
};
