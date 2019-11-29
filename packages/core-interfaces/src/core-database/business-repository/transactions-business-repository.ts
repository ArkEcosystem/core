import { Interfaces } from "@arkecosystem/crypto";
import { IParameters } from "./parameters";

export interface ITransactionsPaginated {
    rows: Interfaces.ITransactionData[];
    count: number;
}

export interface ITransactionsBusinessRepository {
    search(params: IParameters, sequenceOrder?: "asc" | "desc"): Promise<ITransactionsPaginated>;

    findAllBySender(senderPublicKey: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllByRecipient(recipientId: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    allVotesBySender(senderPublicKey: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllByBlock(blockId: string, parameters?: IParameters): Promise<ITransactionsPaginated>;

    findAllByType(type: number, parameters?: IParameters): Promise<ITransactionsPaginated>;

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
