import { RepositorySearchResult, TransactionRepository } from "@arkecosystem/core-database/src/repositories";
import { Transaction } from "@arkecosystem/core-database/src/models";
import { SearchCriteria, SearchFilter, SearchPagination } from "@arkecosystem/core-database/src/repositories/search";

export type FeeStatistics = {
    type: number;
    typeGroup: number;
    avg: string;
    min: string;
    max: string;
    sum: string;
};

let mockTransaction: Partial<Transaction> | undefined;
let mockTransactions: Partial<Transaction>[] = [];
let mockFeeStatistics: FeeStatistics[] = [];

export const setTransaction = (transaction: Partial<Transaction> | undefined) => {
    mockTransaction = transaction;
};

export const setTransactions = (transactions: Partial<Transaction>[]) => {
    mockTransactions = transactions;
};

export const setFeeStatistics = (feeStatistics: FeeStatistics[]) => {
    mockFeeStatistics = feeStatistics;
};

class TransactionRepositoryMock implements Partial<TransactionRepository> {
    async findByIdAndType(type: number, id: string): Promise<Transaction | undefined> {
        return mockTransaction ? (mockTransaction as Transaction) : undefined;
    }

    async findById(id: string): Promise<Transaction> {
        return mockTransaction as Transaction;
    }

    async search(filter: SearchFilter): Promise<RepositorySearchResult<Transaction>> {
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
    }

    async searchByQuery(
        query: Record<string, any>,
        pagination: SearchPagination,
    ): Promise<RepositorySearchResult<Transaction>> {
        return {
            rows: mockTransactions as Transaction[],
            count: mockTransactions.length,
            countIsEstimate: false,
        };
    }

    async findByType(type: number, typeGroup: number, limit?: number, offset?: number) {
        return mockTransactions as any;
    }

    async findByIds(ids: any[]) {
        return mockTransactions as Transaction[];
    }

    async findReceivedTransactions(): Promise<{ recipientId: string; amount: string }[]> {
        return mockTransactions.map((x) => {
            return { recipientId: x.recipientId!.toString(), amount: x.amount!.toString() };
        });
    }

    async findByHtlcLocks(lockIds: string[]): Promise<Transaction[]> {
        return mockTransactions as Transaction[];
    }

    async getOpenHtlcLocks(): Promise<Array<Transaction & { open: boolean }>> {
        return mockTransactions as any;
    }

    async getClaimedHtlcLockBalances(): Promise<{ amount: string; recipientId: string }[]> {
        return mockTransactions.map((x) => {
            return { recipientId: x.recipientId!.toString(), amount: x.amount!.toString() };
        });
    }

    async getRefundedHtlcLockBalances(): Promise<{ amount: string; senderPublicKey: string }[]> {
        return mockTransactions.map((x) => {
            return { senderPublicKey: x.senderPublicKey!.toString(), amount: x.amount!.toString() };
        });
    }

    async getFeeStatistics(days: number, minFee?: number): Promise<FeeStatistics[]> {
        return mockFeeStatistics;
    }
}

export const instance = new TransactionRepositoryMock();
