import { TransactionTypes } from "../enums";
import { ITransactionData } from "../interfaces";
import { BigNumber } from "../utils/bignum";

export class FeeManager {
    public fees: Record<number, BigNumber> = {};

    public set(type: TransactionTypes | number, value: number) {
        this.fees[type] = BigNumber.make(value);
    }

    public get(type: TransactionTypes | number): BigNumber {
        return this.fees[type];
    }

    public getForTransaction(transaction: ITransactionData): BigNumber {
        const fee: BigNumber = this.fees[transaction.type];

        if (transaction.type === TransactionTypes.MultiSignature) {
            return fee.times(transaction.asset.multisignature.keysgroup.length + 1);
        }

        return fee;
    }
}

export const feeManager = new FeeManager();
