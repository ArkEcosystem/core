import { RepositorySearchResult, TransactionRepository } from "@arkecosystem/core-database/src/repositories";
import { Transaction } from "@arkecosystem/core-database/src/models";
import { SearchCriteria } from "@arkecosystem/core-database/src/repositories/search";

export type FeeStatistics = {
    type: number;
    typeGroup: number;
    avg: string;
    min: string;
    max: string;
    sum: string;
};

let mockTransaction: Partial<Transaction> | null;
let mockTransactions: Partial<Transaction>[];
let mockFeeStatistics: FeeStatistics[] = [];

export const setMockTransaction = (transaction: Partial<Transaction> | null) => {
    mockTransaction = transaction;
};

export const setMockTransactions = (transactions: Partial<Transaction>[]) => {
    mockTransactions = transactions;
};

export const setFeeStatistics = (feeStatistics: FeeStatistics[]) => {
    mockFeeStatistics = feeStatistics;
};

export const instance: Partial<TransactionRepository> = {
    search: async (filter: any): Promise<RepositorySearchResult<Transaction>> => {
        let transitions = mockTransactions as Transaction[];

        const type: SearchCriteria | undefined = filter.criteria
            ? filter.criteria.find((x) => x.field === "type")
            : undefined;

        if (type) {
            transitions = transitions.filter((x) => x.type === type.value);
        }

        return {
            rows: transitions as Transaction[],
            count: transitions.length,
            countIsEstimate: false,
        };
    },
    searchByQuery: async (query: any, pagination: any): Promise<RepositorySearchResult<Transaction>> => {
        return {
            rows: mockTransactions as Transaction[],
            count: mockTransactions.length,
            countIsEstimate: false,
        };
    },
    findByHtlcLocks: async (lockIds: any): Promise<Transaction[]> => {
        return mockTransactions as Transaction[];
    },
    findByIdAndType: async (type: any, id: any): Promise<Transaction | undefined> => {
        return mockTransaction ? (mockTransaction as Transaction) : undefined;
    },
    findById: async (id: any): Promise<Transaction> => {
        return mockTransaction as Transaction;
    },
    findByType: async () => {
        return mockTransactions as any;
    },
    findReceivedTransactions: async () => {
        return mockTransactions.map((x) => {
            return { recipientId: x.recipientId!.toString(), amount: x.amount!.toString() };
        });
    },
    getOpenHtlcLocks: async () => {
        return mockTransaction as any;
    },
    getClaimedHtlcLockBalances: async () => {
        return mockTransactions.map((x) => {
            return { recipientId: x.recipientId!.toString(), amount: x.amount!.toString() };
        });
    },
    getRefundedHtlcLockBalances: async () => {
        return mockTransactions.map((x) => {
            return { senderPublicKey: x.recipientId!.toString(), amount: x.amount!.toString() };
        });
    },
    getFeeStatistics: async (days: any, minFee?: any): Promise<FeeStatistics[]> => {
        return mockFeeStatistics;
    },
};
