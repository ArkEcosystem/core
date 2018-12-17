import { TransactionTypes } from "../../constants";
import { feeManager } from "../../managers/fee";
import { TransactionBuilder } from "./transaction";

export class MultiPaymentBuilder extends TransactionBuilder {
    /**
     * @constructor
     */
    constructor() {
        super();

        this.data.type = TransactionTypes.MultiPayment;
        this.data.fee = feeManager.get(TransactionTypes.MultiPayment);
        this.data.payments = {};
        this.data.vendorFieldHex = null;
    }

    /**
     * Add payment to the multipayment collection.
     * @param {String} address
     * @param {Number} amount
     * @return {MultiPaymentBuilder}
     */
    public addPayment(address, amount) {
        const paymentsCount = Object.keys(this.data.payments).length / 2;

        if (paymentsCount >= 2258) {
            throw new Error("A maximum of 2259 outputs is allowed");
        }

        const key = paymentsCount + 1;
        this.data.payments[`address${key}`] = address;
        this.data.payments[`amount${key}`] = amount;

        return this;
    }

    /**
     * Overrides the inherited method to return the additional required by this.
     * @return {Object}
     */
    public getStruct() {
        const struct = super.getStruct();
        struct.senderPublicKey = this.data.senderPublicKey;
        struct.vendorFieldHex = this.data.vendorFieldHex;

        return Object.assign(struct, this.data.payments);
    }
}
