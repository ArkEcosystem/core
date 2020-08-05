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
    ? boolean | boolean[] | string | string[]
    : T extends number | BigInt | Utils.BigNumber
    ?
          | OrNumericCriteria<number>
          | OrNumericCriteria<BigInt>
          | OrNumericCriteria<Utils.BigNumber>
          | OrNumericCriteria<string>
    : T extends string
    ? string | string[]
    : T extends object
    ? StandardObjectCriteriaOf<T>
    : never;

export type StandardObjectCriteriaOf<T> = StandardObjectCriteriaOfItem<T> | StandardObjectCriteriaOfItem<T>[];
export type StandardObjectCriteriaOfItem<T> = {
    [K in keyof T]?: StandardCriteriaOf<T[K]> | StandardCriteriaOf<T[K]>[];
};
