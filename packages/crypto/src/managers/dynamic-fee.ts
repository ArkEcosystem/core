import { TRANSACTION_TYPES } from "../constants";

class DynamicFeeManager {
    public offsets: {};
    /**
     * @constructor
     */
    constructor() {
        this.offsets = {};
    }

    /**
     * Calculate minimum fee of a transaction for entering the pool.
     * @param {Number} Minimum fee ARKTOSHI/byte
     * @param {Transaction} Transaction for which we calculate the fee
     * @returns {Number} Calculated minimum acceptable fee in ARKTOSHI
     */
    public calculateFee(arktoshiPerByte, transaction) {
        if (arktoshiPerByte <= 0) {
            arktoshiPerByte = 1;
        }

        // serialized is in hex
        const transactionSizeInBytes = transaction.serialized.length / 2;

        return (this.get(transaction.type) + transactionSizeInBytes) * arktoshiPerByte;
    }

    /**
     * Get offsset value based on transaction.
     * @param  {Number} type
     * @return {Number}
     */
    public get(type) {
        return this.offsets[type];
    }

    /**
     * Set offset value based on type.
     * @param {Number} type
     * @param {Number} value
     */
    public set(type, value) {
        if (!this.__validType(type)) {
            throw new Error("Invalid transaction type.");
        }

        this.offsets[type] = value;
    }

    /**
     * Ensure transaction type is valid.
     * @param  {Number} type
     * @return {Boolean}
     */
    public __validType(type) {
        return Object.values(TRANSACTION_TYPES).indexOf(type) > -1;
    }
}

const dynamicFeeManager = new DynamicFeeManager();
export { dynamicFeeManager };
