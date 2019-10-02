import { Utils } from "@arkecosystem/crypto";

const toBoolean = (value): boolean =>
    value
        .toString()
        .toLowerCase()
        .trim() === "true"
        ? true
        : false;

const compareBigNumber = (value, expected, comparison): boolean => {
    try {
        return Utils.BigNumber.make(value)[comparison](expected);
    } catch {
        return false;
    }
};

export const between = (actual, expected): boolean => gt(actual, expected.min) && lt(actual, expected.max);
export const contains = (actual, expected): boolean => actual.includes(expected);
export const eq = (actual, expected): boolean => JSON.stringify(actual) === JSON.stringify(expected);
export const falsy = (actual): boolean => actual === false || !toBoolean(actual);
export const gt = (actual, expected): boolean => compareBigNumber(actual, expected, "isGreaterThan");
export const gte = (actual, expected): boolean => compareBigNumber(actual, expected, "isGreaterThanEqual");
export const lt = (actual, expected): boolean => compareBigNumber(actual, expected, "isLessThan");
export const lte = (actual, expected): boolean => compareBigNumber(actual, expected, "isLessThanEqual");
export const ne = (actual, expected): boolean => !eq(actual, expected);
export const notBetween = (actual, expected): boolean => !between(actual, expected);
export const regexp = (actual, expected): boolean => new RegExp(expected).test(actual);
export const truthy = (actual): boolean => actual === true || toBoolean(actual);
