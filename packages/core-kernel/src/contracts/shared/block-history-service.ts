import { Interfaces as BlockInterfaces } from "@arkecosystem/core-crypto";
import { Interfaces } from "@arkecosystem/crypto";
import { Types } from "@arkecosystem/crypto";

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
    totalAmount?: OrNumericCriteria<Types.BigNumber>;
    totalFee?: OrNumericCriteria<Types.BigNumber>;
    reward?: OrNumericCriteria<Types.BigNumber>;
    payloadLength?: OrNumericCriteria<number>;
    payloadHash?: OrEqualCriteria<string>;
    generatorPublicKey?: OrEqualCriteria<string>;
    blockSignature?: OrEqualCriteria<string>;
};

export type OrBlockCriteria = OrCriteria<BlockCriteria>;

export type BlockDataWithTransactionData = {
    data: BlockInterfaces.IBlockData;
    transactions: Interfaces.ITransactionData[];
};

export interface BlockHistoryService {
    findOneByCriteria(criteria: OrBlockCriteria): Promise<BlockInterfaces.IBlockData | undefined>;

    findManyByCriteria(criteria: OrBlockCriteria): Promise<BlockInterfaces.IBlockData[]>;

    listByCriteria(
        criteria: OrBlockCriteria,
        order: ListOrder,
        page: ListPage,
        options?: ListOptions,
    ): Promise<ListResult<BlockInterfaces.IBlockData>>;

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
