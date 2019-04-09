import { TransactionTypes } from "../enums";
import { ITransactionData } from "../interfaces";

export class FeeManager {
    public fees: { [key: number]: number } = {};

    /**
     * Set fee value based on type.
     */
    public set(type: TransactionTypes | number, value: number) {
        this.fees[type] = value;
    }

    /**
     * Get fee value based on type.
     */
    public get(type: TransactionTypes | number): number {
        return this.fees[type];
    }

    /**
     * Get fee value based on type.
     */
    public getForTransaction(transaction: ITransactionData): number {
        if (transaction.type === TransactionTypes.MultiSignature) {
            return this.fees[transaction.type] * (transaction.asset.multisignature.keysgroup.length + 1);
        }

        return this.fees[transaction.type];
    }
}

export const feeManager = new FeeManager();
