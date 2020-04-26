import { Utils } from "@arkecosystem/crypto";

/**
 * @param {*} value
 * @returns {boolean}
 */
const toBoolean = (value): boolean => (value.toString().toLowerCase().trim() === "true" ? true : false);

/**
 * @param {*} value
 * @param {*} expected
 * @param {*} comparison
 * @returns {boolean}
 */
const compareBigNumber = (value, expected, comparison): boolean => {
    try {
        return Utils.BigNumber.make(value)[comparison](expected);
    } catch {
        return false;
    }
};

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const contains = (actual, expected): boolean => actual.includes(expected);

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const eq = (actual, expected): boolean => JSON.stringify(actual) === JSON.stringify(expected);

/**
 * @param {*} actual
 * @returns {boolean}
 */
export const falsy = (actual): boolean => actual === false || !toBoolean(actual);

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const gt = (actual, expected): boolean => compareBigNumber(actual, expected, "isGreaterThan");

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const gte = (actual, expected): boolean => compareBigNumber(actual, expected, "isGreaterThanEqual");

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const lt = (actual, expected): boolean => compareBigNumber(actual, expected, "isLessThan");

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const lte = (actual, expected): boolean => compareBigNumber(actual, expected, "isLessThanEqual");

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const between = (actual, expected): boolean => gt(actual, expected.min) && lt(actual, expected.max);

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const ne = (actual, expected): boolean => !eq(actual, expected);

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const notBetween = (actual, expected): boolean => !between(actual, expected);

/**
 * @param {*} actual
 * @param {*} expected
 * @returns {boolean}
 */
export const regexp = (actual, expected): boolean => new RegExp(expected).test(actual);

/**
 * @param {*} actual
 * @returns {boolean}
 */
export const truthy = (actual): boolean => actual === true || toBoolean(actual);
