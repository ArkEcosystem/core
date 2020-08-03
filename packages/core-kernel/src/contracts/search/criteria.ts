import { Utils } from "@arkecosystem/crypto";

export type StandardCriteriaOf<T> = StandardCriteriaOfItem<T> | StandardCriteriaOfItem<T>[];
export type StandardCriteriaOfItem<T> = T extends any[]
    ? never
    : T extends boolean
    ? boolean | boolean[] | string | string[]
    : T extends number | BigInt | Utils.BigNumber
    ? NumericCriteria<number> | NumericCriteria<BigInt> | NumericCriteria<Utils.BigNumber> | NumericCriteria<string>
    : T extends string
    ? string | string[]
    : T extends object
    ? StandardObjectCriteriaOf<T>
    : never;

export type StandardObjectCriteriaOf<T> = StandardObjectCriteriaOfItem<T> | StandardObjectCriteriaOfItem<T>[];
export type StandardObjectCriteriaOfItem<T> = {
    [K in keyof T]?: StandardCriteriaOf<T[K]> | StandardCriteriaOf<T[K]>[];
};

export type NumericCriteria<T> = NumericCriteriaItem<T> | NumericCriteriaItem<T>[];
export type NumericCriteriaItem<T> = T | { from: T } | { to: T } | { from: T; to: T };
