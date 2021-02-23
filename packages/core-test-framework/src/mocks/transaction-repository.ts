import { Models, Repositories } from "@arkecosystem/core-database";

export type FeeStatistics = {
    type: number;
    typeGroup: number;
    avg: number;
    min: number;
    max: number;
    sum: number;
};

let mockTransaction: Partial<Models.Transaction> | undefined;
let mockTransactions: Partial<Models.Transaction>[] = [];
let mockFeeStatistics: FeeStatistics[] = [];

export const setTransaction = (transaction: Partial<Models.Transaction> | undefined) => {
    mockTransaction = transaction;
};

export const setTransactions = (transactions: Partial<Models.Transaction>[]) => {
    mockTransactions = transactions;
};

export const setFeeStatistics = (feeStatistics: FeeStatistics[]) => {
    mockFeeStatistics = feeStatistics;
};

class TransactionRepositoryMock implements Partial<Repositories.TransactionRepository> {
    public async findByIdAndType(type: number, id: string): Promise<Models.Transaction | undefined> {
        return mockTransaction ? (mockTransaction as Models.Transaction) : undefined;
    }

    public async findById(id: string): Promise<Models.Transaction> {
        return mockTransaction as Models.Transaction;
    }

    public async findByType(type: number, typeGroup: number, limit?: number, offset?: number) {
        return mockTransactions as any;
    }

    public async findByIds(ids: any[]) {
        return mockTransactions as Models.Transaction[];
    }

    public async findReceivedTransactions(): Promise<{ recipientId: string; amount: string }[]> {
        return mockTransactions.map((x) => {
            return { recipientId: x.recipientId!.toString(), amount: x.amount!.toString() };
        });
    }

    public async findByHtlcLocks(lockIds: string[]): Promise<Models.Transaction[]> {
        return mockTransactions as Models.Transaction[];
    }

    public async getOpenHtlcLocks(): Promise<Array<Models.Transaction & { open: boolean }>> {
        return mockTransactions as any;
    }

    public async getClaimedHtlcLockBalances(): Promise<{ claimedBalance: string; recipientId: string }[]> {
        return mockTransactions.map((x) => {
            return { recipientId: x.recipientId!.toString(), claimedBalance: x.amount!.toString() };
        });
    }

    public async getRefundedHtlcLockBalances(): Promise<{ refundedBalance: string; senderPublicKey: string }[]> {
        return mockTransactions.map((x) => {
            return { senderPublicKey: x.senderPublicKey!.toString(), refundedBalance: x.amount!.toString() };
        });
    }

    public async getFeeStatistics(txTypes: Array<{ type: number, typeGroup: number }>, days: number, minFee?: number): Promise<FeeStatistics[]> {
        return mockFeeStatistics;
    }
}

export const instance = new TransactionRepositoryMock();
