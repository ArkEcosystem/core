import { TRANSACTION_TYPES } from "../constants";

export class FeeManager {
    public fees: {};
    /**
     * @constructor
     */
    constructor() {
        this.fees = {};
    }

    /**
     * Set fee value based on type.
     * @param {Number} type
     * @param {Number} value
     */
    public set(type, value) {
        if (!this.__validType(type)) {
            throw new Error("Invalid transaction type.");
        }

        this.fees[type] = value;
    }

    /**
     * Get fee value based on type.
     * @param  {Number} type
     * @return {Number}
     */
    public get(type) {
        return this.fees[type];
    }

    /**
     * Get fee value based on type.
     * @param  {Transaction} transaction
     * @return {Number}
     */
    public getForTransaction(transaction) {
        if (transaction.type === TRANSACTION_TYPES.MULTI_SIGNATURE) {
            return this.fees[transaction.type] * (transaction.asset.multisignature.keysgroup.length + 1);
        }

        return this.fees[transaction.type];
    }

    /**
     * Ensure fee type is valid.
     * @param  {Number} type
     * @return {Boolean}
     */
    public __validType(type) {
        return Object.values(TRANSACTION_TYPES).indexOf(type) > -1;
    }
}

const feeManager = new FeeManager();
export { feeManager };
