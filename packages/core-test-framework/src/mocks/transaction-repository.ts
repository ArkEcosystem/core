import { Transaction } from "@arkecosystem/core-database/src/models";
import { RepositorySearchResult, TransactionRepository } from "@arkecosystem/core-database/src/repositories";
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
    public async findByIdAndType(type: number, id: string): Promise<Transaction | undefined> {
        return mockTransaction ? (mockTransaction as Transaction) : undefined;
    }

    public async findById(id: string): Promise<Transaction> {
        return mockTransaction as Transaction;
    }

    public async search(filter: SearchFilter): Promise<RepositorySearchResult<Transaction>> {
        let transitions = mockTransactions as Transaction[];

        const type: SearchCriteria | undefined = filter.criteria
            ? filter.criteria.find((x) => x.field === "type")
            : undefined;

        if (type) {
            transitions = transitions.filter((x) => x.type === type.value);
        }

        return {
            rows: transitions,
            count: transitions.length,
            countIsEstimate: false,
        };
    }

    public async searchByQuery(
        query: Record<string, any>,
        pagination: SearchPagination,
    ): Promise<RepositorySearchResult<Transaction>> {
        return {
            rows: mockTransactions as Transaction[],
            count: mockTransactions.length,
            countIsEstimate: false,
        };
    }

    public async findByType(type: number, typeGroup: number, limit?: number, offset?: number) {
        return mockTransactions as any;
    }

    public async findByIds(ids: any[]) {
        return mockTransactions as Transaction[];
    }

    public async findReceivedTransactions(): Promise<{ recipientId: string; amount: string }[]> {
        return mockTransactions.map((x) => {
            return { recipientId: x.recipientId!.toString(), amount: x.amount!.toString() };
        });
    }

    public async findByHtlcLocks(lockIds: string[]): Promise<Transaction[]> {
        return mockTransactions as Transaction[];
    }

    public async getOpenHtlcLocks(): Promise<Array<Transaction & { open: boolean }>> {
        return mockTransactions as any;
    }

    public async getClaimedHtlcLockBalances(): Promise<{ amount: string; recipientId: string }[]> {
        return mockTransactions.map((x) => {
            return { recipientId: x.recipientId!.toString(), amount: x.amount!.toString() };
        });
    }

    public async getRefundedHtlcLockBalances(): Promise<{ amount: string; senderPublicKey: string }[]> {
        return mockTransactions.map((x) => {
            return { senderPublicKey: x.senderPublicKey!.toString(), amount: x.amount!.toString() };
        });
    }

    public async getFeeStatistics(days: number, minFee?: number): Promise<FeeStatistics[]> {
        return mockFeeStatistics;
    }
}

export const instance = new TransactionRepositoryMock();
