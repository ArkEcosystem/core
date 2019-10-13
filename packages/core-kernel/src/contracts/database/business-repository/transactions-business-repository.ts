import { Interfaces } from "@arkecosystem/crypto";

import { Parameters } from "./parameters";

export interface TransactionsPaginated {
    rows: Interfaces.ITransactionData[];
    count: number;
}

export interface TransactionsBusinessRepository {
    search(params: Parameters, sequenceOrder?: "asc" | "desc"): Promise<TransactionsPaginated>;

    findAllBySender(senderPublicKey: string, parameters?: Parameters): Promise<TransactionsPaginated>;

    findAllByRecipient(recipientId: string, parameters?: Parameters): Promise<TransactionsPaginated>;

    allVotesBySender(senderPublicKey: string, parameters?: Parameters): Promise<TransactionsPaginated>;

    findAllByBlock(blockId: string, parameters?: Parameters): Promise<TransactionsPaginated>;

    findAllByType(type: number, parameters?: Parameters): Promise<TransactionsPaginated>;

    findById(id: string): Promise<Interfaces.ITransactionData>;

    findByTypeAndId(type: number, id: string): Promise<Interfaces.ITransactionData>;

    getCountOfType(type: number, typeGroup?: number): Promise<number>;

    getAssetsByType(type: number, typeGroup: number, limit: number, offset: number): Promise<any>;

    getReceivedTransactions(): Promise<any>;

    getSentTransactions(): Promise<any>;

    getOpenHtlcLocks(): Promise<any>;

    getRefundedHtlcLocks(): Promise<any>;

    getClaimedHtlcLocks(): Promise<any>;

    findByHtlcLocks(lockIds: string[]): Promise<Interfaces.ITransactionData[]>;

    getFeeStatistics(
        days: number,
    ): Promise<
        Array<{
            type: number;
            fee: number;
            timestamp: number;
        }>
    >;
}
