import { Utils } from "@arkecosystem/crypto";

export type EqualCriteria<T> = T;
export type NumericCriteria<T> = T | { from: T } | { to: T } | { from: T; to: T };
export type LikeCriteria<T> = T;
export type ContainsCriteria<T> = T;

export type OrCriteria<TCriteria> = TCriteria | TCriteria[];

export type OrEqualCriteria<T> = OrCriteria<EqualCriteria<T>>;
export type OrNumericCriteria<T> = OrCriteria<NumericCriteria<T>>;
export type OrLikeCriteria<T> = OrCriteria<LikeCriteria<T>>;
export type OrContainsCriteria<T> = OrCriteria<ContainsCriteria<T>>;

// WALLET REPOSITORY SEARCH

export type StandardCriteriaOf<T> = StandardCriteriaOfItem<T> | StandardCriteriaOfItem<T>[];
export type StandardCriteriaOfItem<T> = T extends any[]
    ? never
    : T extends boolean
    ? boolean | string
    : T extends number
    ? NumericCriteria<number | string>
    : T extends BigInt | Utils.BigNumber
    ? NumericCriteria<number | BigInt | Utils.BigNumber | string>
    : T extends string
    ? string
    : T extends object
    ? { [K in keyof T]?: StandardCriteriaOf<T[K]> } | { "*"?: unknown }
    : never;
