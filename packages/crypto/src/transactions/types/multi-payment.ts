import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import { IMultiPaymentItem } from "../../interfaces";
import { BigNumber } from "../../utils";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class MultiPaymentTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.MultiPayment;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiPayment;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer = new ByteBuffer(64, true);

        buffer.writeUint32(data.asset.payments.length);
        data.asset.payments.forEach(p => {
            buffer.writeUint64(+new BigNumber(p.amount).toFixed());
            buffer.append(bs58check.decode(p.recipientId));
        });

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const payments: IMultiPaymentItem[] = [];
        const total = buf.readUint32();

        for (let j = 0; j < total; j++) {
            payments.push({
                amount: new BigNumber(buf.readUint64().toString()),
                recipientId: bs58check.encode(buf.readBytes(21).toBuffer()),
            });
        }

        data.amount = payments.reduce((a, p) => a.plus(p.amount), BigNumber.ZERO);
        data.asset = { payments };
    }
}
