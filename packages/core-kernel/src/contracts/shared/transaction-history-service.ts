import { Interfaces, Utils } from "@arkecosystem/crypto";

import {
    ListOptions,
    ListOrder,
    ListPage,
    ListResult,
    OrContainsCriteria,
    OrCriteria,
    OrEqualCriteria,
    OrLikeCriteria,
    OrNumericCriteria,
} from "../search";

export type TransactionCriteria = {
    address?: OrEqualCriteria<string>;
    senderId?: OrEqualCriteria<string>;
    recipientId?: OrEqualCriteria<string>;
    id?: OrEqualCriteria<string>;
    version?: OrEqualCriteria<number>;
    blockId?: OrEqualCriteria<string>;
    sequence?: OrNumericCriteria<number>;
    timestamp?: OrNumericCriteria<number>;
    nonce?: OrNumericCriteria<Utils.BigNumber>;
    senderPublicKey?: OrEqualCriteria<string>;
    type?: OrEqualCriteria<number>;
    typeGroup?: OrEqualCriteria<number>;
    vendorField?: OrLikeCriteria<string>;
    amount?: OrNumericCriteria<Utils.BigNumber>;
    fee?: OrNumericCriteria<Utils.BigNumber>;
    asset?: OrContainsCriteria<Record<string, any>>;
};

export type OrTransactionCriteria = OrCriteria<TransactionCriteria>;

export interface TransactionHistoryService {
    findOneByCriteria(criteria: OrTransactionCriteria): Promise<Interfaces.ITransactionData | undefined>;
    findManyByCriteria(criteria: OrTransactionCriteria): Promise<Interfaces.ITransactionData[]>;
    listByCriteria(
        criteria: OrTransactionCriteria,
        order: ListOrder,
        page: ListPage,
        options?: ListOptions,
    ): Promise<ListResult<Interfaces.ITransactionData>>;
}
