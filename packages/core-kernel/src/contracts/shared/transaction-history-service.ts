import { Interfaces } from "@arkecosystem/crypto";

import { Wallet } from "../state/wallets";
import { OrTransactionCriteria } from "./criteria";
import { ListingOrder, ListingPage, ListingResult } from "./listing";

export interface TransactionHistoryService {
    findOneByCriteria(criteria: OrTransactionCriteria): Promise<Interfaces.ITransactionData | undefined>;
    findOneById(id: string): Promise<Interfaces.ITransactionData | undefined>;

    findManyByCriteria(criteria: OrTransactionCriteria): Promise<Interfaces.ITransactionData[]>;

    listByCriteria(
        criteria: OrTransactionCriteria,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.ITransactionData>>;

    listByBlockIdAndCriteria(
        blockId: string,
        criteria: OrTransactionCriteria,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.ITransactionData>>;

    listHtlcClaimRefundByLockIds(
        lockIds: string[],
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.ITransactionData>>;

    listVoteByCriteria(
        criteria: OrTransactionCriteria,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.ITransactionData>>;

    listByWalletAndCriteria(
        wallet: Wallet,
        criteria: OrTransactionCriteria,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.ITransactionData>>;

    listBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: OrTransactionCriteria,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.ITransactionData>>;

    listByRecipientIdAndCriteria(
        recipientId: string,
        criteria: OrTransactionCriteria,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.ITransactionData>>;

    listVoteBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: OrTransactionCriteria,
        order: ListingOrder,
        page: ListingPage,
    ): Promise<ListingResult<Interfaces.ITransactionData>>;
}
