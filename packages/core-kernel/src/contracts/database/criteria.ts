import { Utils } from "@arkecosystem/crypto";

export type Numeric = number | bigint | Utils.BigNumber;

export type EqualCriteria<T> = T;
export type BetweenCriteria<T> = { from: T; to: T };
export type GreaterThanEqualCriteria<T> = { from: T };
export type LessThanEqualCriteria<T> = { to: T };
export type LikeCriteria<T> = T;
export type ContainsCriteria<T> = T;
export type NumericCriteria<T> =
    | EqualCriteria<T>
    | BetweenCriteria<T>
    | GreaterThanEqualCriteria<T>
    | LessThanEqualCriteria<T>;

export type OrCriteria<TCriteria> = TCriteria | TCriteria[];

export const someOrCriteria = <TCriteria>(
    criteria: OrCriteria<TCriteria>,
    predicate: (criteria: TCriteria) => boolean,
): boolean => {
    return Array.isArray(criteria) ? criteria.some(predicate) : predicate(criteria);
};

export const everyOrCriteria = <TCriteria>(
    criteria: OrCriteria<TCriteria>,
    predicate: (criteria: TCriteria) => boolean,
): boolean => {
    return Array.isArray(criteria) ? criteria.every(predicate) : predicate(criteria);
};

export const hasOrCriteria = <TCriteria>(criteria: OrCriteria<TCriteria>): boolean => {
    return someOrCriteria(criteria, () => true);
};

export type BlockCriteria = {
    id?: OrCriteria<EqualCriteria<string>>;
    version?: OrCriteria<EqualCriteria<number>>;
    timestamp?: OrCriteria<NumericCriteria<number>>;
    previousBlock?: OrCriteria<EqualCriteria<string>>;
    height?: OrCriteria<NumericCriteria<number>>;
    numberOfTransactions?: OrCriteria<NumericCriteria<number>>;
    totalAmount?: OrCriteria<NumericCriteria<number>>;
    totalFee?: OrCriteria<NumericCriteria<number>>;
    reward?: OrCriteria<NumericCriteria<number>>;
    payloadLength?: OrCriteria<NumericCriteria<number>>;
    payloadHash?: OrCriteria<EqualCriteria<string>>;
    generatorPublicKey?: OrCriteria<EqualCriteria<string>>;
    blockSignature?: OrCriteria<EqualCriteria<string>>;
};

export type TransactionWalletCriteria = {
    address: string;
    publicKey?: string;
};

export type TransactionCriteria = {
    wallet?: OrCriteria<TransactionWalletCriteria>;
    senderId?: OrCriteria<EqualCriteria<string>>;

    id?: OrCriteria<EqualCriteria<string>>;
    version?: OrCriteria<EqualCriteria<number>>;
    blockId?: OrCriteria<EqualCriteria<string>>;
    sequence?: OrCriteria<NumericCriteria<number>>;
    timestamp?: OrCriteria<NumericCriteria<number>>;
    nonce?: OrCriteria<NumericCriteria<number>>;
    senderPublicKey?: OrCriteria<EqualCriteria<string>>;
    recipientId?: OrCriteria<EqualCriteria<string>>;
    type?: OrCriteria<EqualCriteria<number>>;
    typeGroup?: OrCriteria<EqualCriteria<number>>;
    vendorField?: OrCriteria<LikeCriteria<string>>;
    amount?: OrCriteria<NumericCriteria<number>>;
    fee?: OrCriteria<NumericCriteria<number>>;
    asset?: OrCriteria<ContainsCriteria<Record<string, any>>>;
};
