import { Interfaces, Utils } from "@arkecosystem/crypto";

import { NumericCriteria } from "../search";

export type TransactionCriteriaItem = {
    id?: string | string[];
    version?: number | number[];
    typeGroup?: number | number[];
    type?: number | number[];
    senderPublicKey?: string | string[];
    nonce?: NumericCriteria<Utils.BigNumber>;
    recipientId?: string | string[];
    amount?: NumericCriteria<Utils.BigNumber>;
    vendorField?: string | string[];
    fee?: Utils.BigNumber | Utils.BigNumber[];
    asset?: object | object[];
};

export type TransactionCriteria = TransactionCriteriaItem | TransactionCriteriaItem[];

export interface TransactionHistoryService {
    getTransaction(...criterias: TransactionCriteria[]): Promise<Interfaces.ITransactionData | undefined>;
    getTransactions(...criterias: TransactionCriteria[]): Promise<Interfaces.ITransactionData[]>;
    getTransactionsStream(...criterias: TransactionCriteria[]): AsyncIterable<Interfaces.ITransactionData>;
}
