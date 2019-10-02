import { Utils } from "@arkecosystem/crypto";

const toBoolean = (value): boolean =>
    value
        .toString()
        .toLowerCase()
        .trim() === "true"
        ? true
        : false;

export const between = (actual, expected): boolean => gt(actual, expected.min) && lt(actual, expected.max);
export const contains = (actual, expected): boolean => actual.includes(expected);
export const eq = (actual, expected): boolean => JSON.stringify(actual) === JSON.stringify(expected);
export const falsy = (actual): boolean => actual === false || !toBoolean(actual);
export const gt = (actual, expected): boolean => Utils.BigNumber.make(actual).isGreaterThan(expected);
export const gte = (actual, expected): boolean => Utils.BigNumber.make(actual).isGreaterThanEqual(expected);
export const lt = (actual, expected): boolean => Utils.BigNumber.make(actual).isLessThan(expected);
export const lte = (actual, expected): boolean => Utils.BigNumber.make(actual).isLessThanEqual(expected);
export const ne = (actual, expected): boolean => !eq(actual, expected);
export const notBetween = (actual, expected): boolean => !between(actual, expected);
export const regexp = (actual, expected): boolean => new RegExp(expected).test(actual);
export const truthy = (actual): boolean => actual === true || toBoolean(actual);
