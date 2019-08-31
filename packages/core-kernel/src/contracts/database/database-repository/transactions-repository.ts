import { Enums, Interfaces, Utils } from "@arkecosystem/crypto";

import { Wallet } from "../../state/wallets";
import { TransactionsPaginated } from "../business-repository";
import { SearchOrderBy, SearchPaginate, SearchParameters } from "../search";
import { Repository } from "./repository";

export interface TransactionsRepository extends Repository {
    findById(id: string): Promise<Interfaces.ITransactionData>;

    findByBlockId(
        blockId: string,
    ): Promise<
        Array<{
            id: string;
            serialized: Buffer;
        }>
    >;

    latestByBlock(
        blockId: string,
    ): Promise<
        Array<{
            id: string;
            serialized: Buffer;
        }>
    >;

    latestByBlocks(
        blockIds: string[],
    ): Promise<
        Array<{
            id: string;
            blockId: string;
            serialized: Buffer;
        }>
    >;

    getAssetsByType(type: Enums.TransactionType | number): Promise<any>;

    getReceivedTransactions(): Promise<any>;

    getSentTransactions(): Promise<any>;

    forged(ids: string[]): Promise<Interfaces.ITransactionData[]>;

    statistics(): Promise<{
        count: number;
        totalFee: Utils.BigNumber;
        totalAmount: Utils.BigNumber;
    }>;

    getFeeStatistics(
        days: number,
        minFeeBroadcast: number,
    ): Promise<Array<{ type: number; fee: number; timestamp: number }>>;

    deleteByBlockId(blockIds: string[], db: any): Promise<void>;

    findAllByWallet(
        wallet: Wallet,
        paginate?: SearchPaginate,
        orderBy?: SearchOrderBy[],
    ): Promise<TransactionsPaginated>;

    search(parameters: SearchParameters): Promise<TransactionsPaginated>;
}
