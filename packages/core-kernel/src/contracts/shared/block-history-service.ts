import { Interfaces, Utils } from "@arkecosystem/crypto";

import {
    ListOptions,
    ListOrder,
    ListPage,
    ListResult,
    OrCriteria,
    OrEqualCriteria,
    OrNumericCriteria,
} from "../search";
import { OrTransactionCriteria } from "./transaction-history-service";

export type BlockCriteria = {
    id?: OrEqualCriteria<string>;
    version?: OrEqualCriteria<number>;
    timestamp?: OrNumericCriteria<number>;
    previousBlock?: OrEqualCriteria<string>;
    height?: OrNumericCriteria<number>;
    numberOfTransactions?: OrNumericCriteria<number>;
    totalAmount?: OrNumericCriteria<Utils.BigNumber>;
    totalFee?: OrNumericCriteria<Utils.BigNumber>;
    reward?: OrNumericCriteria<Utils.BigNumber>;
    payloadLength?: OrNumericCriteria<number>;
    payloadHash?: OrEqualCriteria<string>;
    generatorPublicKey?: OrEqualCriteria<string>;
    blockSignature?: OrEqualCriteria<string>;
};

export type OrBlockCriteria = OrCriteria<BlockCriteria>;

export type BlockDataWithTransactionData = {
    data: Interfaces.IBlockData;
    transactions: Interfaces.ITransactionData[];
};

export interface BlockHistoryService {
    findOneByCriteria(criteria: OrBlockCriteria): Promise<Interfaces.IBlockData | undefined>;

    findManyByCriteria(criteria: OrBlockCriteria): Promise<Interfaces.IBlockData[]>;

    listByCriteria(
        criteria: OrBlockCriteria,
        order: ListOrder,
        page: ListPage,
        options?: ListOptions,
    ): Promise<ListResult<Interfaces.IBlockData>>;

    findOneByCriteriaJoinTransactions(
        blockCriteria: OrBlockCriteria,
        transactionCriteria: OrTransactionCriteria,
    ): Promise<BlockDataWithTransactionData | undefined>;

    findManyByCriteriaJoinTransactions(
        blockCriteria: OrBlockCriteria,
        transactionCriteria: OrTransactionCriteria,
    ): Promise<BlockDataWithTransactionData[]>;

    listByCriteriaJoinTransactions(
        blockCriteria: OrBlockCriteria,
        transactionCriteria: OrTransactionCriteria,
        order: ListOrder,
        page: ListPage,
        options?: ListOptions,
    ): Promise<ListResult<BlockDataWithTransactionData>>;
}
