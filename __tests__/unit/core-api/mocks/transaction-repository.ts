import { RepositorySearchResult, TransactionRepository } from "@packages/core-database/src/repositories";
import { Transaction } from "@packages/core-database/src/models";

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

export const transactionRepository: Partial<TransactionRepository> = {
    search: async (filter: any): Promise<RepositorySearchResult<Transaction>> => {
        return {
            rows: mockTransactions as Transaction[],
            count: mockTransactions.length,
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
    findById: async (id: any): Promise<Transaction> => {
        return mockTransaction as Transaction;
    },
    getFeeStatistics: async (days: any, minFee?: any): Promise<FeeStatistics[]> => {
        return mockFeeStatistics;
    },
};
