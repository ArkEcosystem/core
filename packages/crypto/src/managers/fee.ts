import { TransactionTypes } from "../enums";
import { ITransactionData } from "../interfaces";
import { Bignum } from "../utils/bignum";

export class FeeManager {
    public fees: { [key: number]: Bignum } = {};

    public set(type: TransactionTypes | number, value: number) {
        this.fees[type] = new Bignum(value);
    }

    public get(type: TransactionTypes | number): Bignum {
        return this.fees[type];
    }

    public getForTransaction(transaction: ITransactionData): Bignum {
        const fee: Bignum = this.fees[transaction.type];

        if (transaction.type === TransactionTypes.MultiSignature) {
            return fee.times(transaction.asset.multisignature.keysgroup.length + 1);
        }

        return fee;
    }
}

export const feeManager = new FeeManager();
