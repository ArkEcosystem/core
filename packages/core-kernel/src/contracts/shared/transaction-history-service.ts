import { Interfaces, Utils } from "@arkecosystem/crypto";

import {
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
    senderId?: OrEqualCriteria<string>;

    id?: OrEqualCriteria<string>;
    version?: OrEqualCriteria<number>;
    blockId?: OrEqualCriteria<string>;
    sequence?: OrNumericCriteria<number>;
    timestamp?: OrNumericCriteria<number>;
    nonce?: OrNumericCriteria<Utils.BigNumber>;
    senderPublicKey?: OrEqualCriteria<string>;
    recipientId?: OrEqualCriteria<string>;
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
    ): Promise<ListResult<Interfaces.ITransactionData>>;
}
