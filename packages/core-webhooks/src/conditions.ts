import { CryptoManager } from "@arkecosystem/core-crypto";

export class Conditions {
    public constructor(private cryptoManager: CryptoManager) {}

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public contains(actual, expected): boolean {
        return actual.includes(expected);
    }

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public eq(actual, expected): boolean {
        return JSON.stringify(actual) === JSON.stringify(expected);
    }

    /**
     * @param {*} actual
     * @returns {boolean}
     */
    public falsy(actual): boolean {
        return actual === false || !this.toBoolean(actual);
    }

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public gt(actual, expected): boolean {
        return this.compareBigNumber(actual, expected, "isGreaterThan");
    }

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public gte(actual, expected): boolean {
        return this.compareBigNumber(actual, expected, "isGreaterThanEqual");
    }

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public lt(actual, expected): boolean {
        return this.compareBigNumber(actual, expected, "isLessThan");
    }

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public lte(actual, expected): boolean {
        return this.compareBigNumber(actual, expected, "isLessThanEqual");
    }

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public between(actual, expected): boolean {
        return this.gt(actual, expected.min) && this.lt(actual, expected.max);
    }

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public ne(actual, expected): boolean {
        return !this.eq(actual, expected);
    }

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public notBetween(actual, expected): boolean {
        return !this.between(actual, expected);
    }

    /**
     * @param {*} actual
     * @param {*} expected
     * @returns {boolean}
     */
    public regexp(actual, expected): boolean {
        return new RegExp(expected).test(actual);
    }

    /**
     * @param {*} actual
     * @returns {boolean}
     */
    public truthy(actual): boolean {
        return actual === true || this.toBoolean(actual);
    }

    /**
     * @param {*} value
     * @returns {boolean}
     */
    private toBoolean(value): boolean {
        return value.toString().toLowerCase().trim() === "true" ? true : false;
    }

    /**
     * @param {*} value
     * @param {*} expected
     * @param {*} comparison
     * @returns {boolean}
     */
    private compareBigNumber(value, expected, comparison): boolean {
        try {
            return this.cryptoManager.LibraryManager.Libraries.BigNumber.make(value)[comparison](expected);
        } catch {
            return false;
        }
    }
}
