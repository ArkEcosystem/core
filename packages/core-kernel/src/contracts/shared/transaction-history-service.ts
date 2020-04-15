import { Interfaces } from "@arkecosystem/crypto";

import { OrTransactionCriteria } from "./criteria";
import { ListingOrder, ListingPage, ListingResult } from "./listing";

export interface TransactionHistoryService {
    findOneByCriteria(...criteria: OrTransactionCriteria[]): Promise<Interfaces.ITransactionData | undefined>;

    findManyByCriteria(...criteria: OrTransactionCriteria[]): Promise<Interfaces.ITransactionData[]>;

    listByCriteria(
        page: ListingPage,
        order: ListingOrder,
        ...criteria: OrTransactionCriteria[]
    ): Promise<ListingResult<Interfaces.ITransactionData>>;
}
