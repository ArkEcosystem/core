import { Interfaces } from "@arkecosystem/crypto";

import { OrTransactionCriteria } from "./criteria";
import { ListingOrder, ListingPage, ListingResult } from "./listing";

export interface TransactionHistoryService {
    findOneByCriteria(criteria: OrTransactionCriteria): Promise<Interfaces.ITransactionData | undefined>;

    findManyByCriteria(criteria: OrTransactionCriteria): Promise<Interfaces.ITransactionData[]>;

    listByCriteria(
        criteria: OrTransactionCriteria,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.ITransactionData>>;
}
