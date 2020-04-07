import { Utils } from "@arkecosystem/crypto";

import { OrContainsCriteria, OrCriteria, OrEqualCriteria, OrLikeCriteria, OrNumericCriteria } from "./filters";
import { Transaction } from "./models";
import { SearchPage, SearchResult } from "./search-utils";

export type TransactionWalletCriteria = {
    address: string;
    publicKey?: string;
};

export type OrTransactionWalletCriteria = OrCriteria<TransactionWalletCriteria>;

export type TransactionCriteria = {
    wallet?: OrTransactionWalletCriteria;
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
    amount?: OrNumericCriteria<BigInt>;
    fee?: OrNumericCriteria<BigInt>;
    asset?: OrContainsCriteria<Record<string, any>>;
};

export type OrTransactionCriteria = OrCriteria<TransactionCriteria>;

export interface TransactionService {
    search(criteria: OrTransactionCriteria, order?: string, page?: SearchPage): Promise<SearchResult<Transaction>>;
    searchOne(criteria: TransactionCriteria): Promise<Transaction>;
}
