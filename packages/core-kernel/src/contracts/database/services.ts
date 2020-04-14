import { Interfaces } from "@arkecosystem/crypto";

import { Wallet } from "../state/wallets";
import { OrBlockCriteria, OrTransactionCriteria } from "./criteria";
import { Expression } from "./expressions";

export type ListOrder = {
    property: string;
    direction: "asc" | "desc";
}[];

export type ListPage = {
    offset: number;
    limit: number;
};

export type ListResult<TModel> = {
    rows: TModel[];
    count: number;
    countIsEstimate: boolean;
};

export interface BlockFilter {
    getCriteriaExpression(...criteria: OrBlockCriteria[]): Promise<Expression>;
}

export interface TransactionFilter {
    getCriteriaExpression(...criteria: OrTransactionCriteria[]): Promise<Expression>;
}

export interface BlockService {
    findOneByCriteria(criteria: OrBlockCriteria): Promise<Interfaces.IBlockData | undefined>;
    findOneByIdOrHeight(idOrHeight: string | number): Promise<Interfaces.IBlockData | undefined>;

    findManyByCriteria(criteria: OrBlockCriteria): Promise<Interfaces.IBlockData[]>;

    listByCriteria(
        criteria: OrBlockCriteria,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.IBlockData>>;

    listByGeneratorPublicKey(
        generatorPublicKey: string,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.IBlockData>>;
}

export interface TransactionService {
    findOneByCriteria(criteria: OrTransactionCriteria): Promise<Interfaces.ITransactionData | undefined>;
    findOneById(id: string): Promise<Interfaces.ITransactionData | undefined>;

    findManyByCriteria(criteria: OrTransactionCriteria): Promise<Interfaces.ITransactionData[]>;

    listByCriteria(
        criteria: OrTransactionCriteria,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.ITransactionData>>;

    listByBlockIdAndCriteria(
        blockId: string,
        criteria: OrTransactionCriteria,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.ITransactionData>>;

    listHtlcClaimRefundByLockIds(
        lockIds: string[],
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.ITransactionData>>;

    listVoteByCriteria(
        criteria: OrTransactionCriteria,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.ITransactionData>>;

    listByWalletAndCriteria(
        wallet: Wallet,
        criteria: OrTransactionCriteria,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.ITransactionData>>;

    listBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: OrTransactionCriteria,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.ITransactionData>>;

    listByRecipientIdAndCriteria(
        recipientId: string,
        criteria: OrTransactionCriteria,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.ITransactionData>>;

    listVoteBySenderPublicKeyAndCriteria(
        senderPublicKey: string,
        criteria: OrTransactionCriteria,
        order: ListOrder,
        page: ListPage,
    ): Promise<ListResult<Interfaces.ITransactionData>>;
}
