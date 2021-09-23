"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("@arkecosystem/crypto");
const toBoolean = (value) => value
    .toString()
    .toLowerCase()
    .trim() === "true"
    ? true
    : false;
const compareBigNumber = (value, expected, comparison) => {
    try {
        return crypto_1.Utils.BigNumber.make(value)[comparison](expected);
    }
    catch (_a) {
        return false;
    }
};
exports.between = (actual, expected) => exports.gt(actual, expected.min) && exports.lt(actual, expected.max);
exports.contains = (actual, expected) => actual.includes(expected);
exports.eq = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
exports.falsy = (actual) => actual === false || !toBoolean(actual);
exports.gt = (actual, expected) => compareBigNumber(actual, expected, "isGreaterThan");
exports.gte = (actual, expected) => compareBigNumber(actual, expected, "isGreaterThanEqual");
exports.lt = (actual, expected) => compareBigNumber(actual, expected, "isLessThan");
exports.lte = (actual, expected) => compareBigNumber(actual, expected, "isLessThanEqual");
exports.ne = (actual, expected) => !exports.eq(actual, expected);
exports.notBetween = (actual, expected) => !exports.between(actual, expected);
exports.regexp = (actual, expected) => new RegExp(expected).test(actual);
exports.truthy = (actual) => actual === true || toBoolean(actual);
//# sourceMappingURL=conditions.js.map