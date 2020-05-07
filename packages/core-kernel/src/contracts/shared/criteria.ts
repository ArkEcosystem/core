import { Types } from "@arkecosystem/crypto";

export type EqualCriteria<T> = T;
export type NumericCriteria<T> = T | { from: T } | { to: T } | { from: T; to: T };
export type LikeCriteria<T> = T;
export type ContainsCriteria<T> = T;

export type OrCriteria<TCriteria> = TCriteria | TCriteria[];
export type OrCriteriaItem<TOrCriteria> = TOrCriteria extends (infer TOrCriteriaItem)[] ? TOrCriteriaItem : TOrCriteria;

export type OrEqualCriteria<T> = OrCriteria<EqualCriteria<T>>;
export type OrNumericCriteria<T> = OrCriteria<NumericCriteria<T>>;
export type OrLikeCriteria<T> = OrCriteria<LikeCriteria<T>>;
export type OrContainsCriteria<T> = OrCriteria<ContainsCriteria<T>>;

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

export type TransactionCriteria = {
    senderId?: OrEqualCriteria<string>;

    id?: OrEqualCriteria<string>;
    version?: OrEqualCriteria<number>;
    blockId?: OrEqualCriteria<string>;
    sequence?: OrNumericCriteria<number>;
    timestamp?: OrNumericCriteria<number>;
    nonce?: OrNumericCriteria<Types.BigNumber>;
    senderPublicKey?: OrEqualCriteria<string>;
    recipientId?: OrEqualCriteria<string>;
    type?: OrEqualCriteria<number>;
    typeGroup?: OrEqualCriteria<number>;
    vendorField?: OrLikeCriteria<string>;
    amount?: OrNumericCriteria<Types.BigNumber>;
    fee?: OrNumericCriteria<Types.BigNumber>;
    asset?: OrContainsCriteria<Record<string, any>>;
};

export type OrBlockCriteria = OrCriteria<BlockCriteria>;
export type OrTransactionCriteria = OrCriteria<TransactionCriteria>;
