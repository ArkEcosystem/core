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
            if (transaction.version === 2) {
                return fee.times(transaction.asset.multiSignature.publicKeys.length + 1);
            } else {
                return fee.times(transaction.asset.multiSignatureLegacy.keysgroup.length + 1);
            }
        }

        return fee;
    }
}

export const feeManager = new FeeManager();
