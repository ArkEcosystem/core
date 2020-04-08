import { Transaction } from "@arkecosystem/core-database/src/models";
import { TransactionRepository } from "@arkecosystem/core-database/src/repositories";
import { Contracts } from "@arkecosystem/core-kernel";

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

    public async search(
        expressions: Contracts.Database.Expression<Transaction>,
        order: Contracts.Database.SearchOrder<Transaction>,
        page: Contracts.Database.SearchPage,
    ): Promise<Contracts.Database.SearchResult<Transaction>> {
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
