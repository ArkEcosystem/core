import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import { IMultiPaymentItem, ISerializeOptions } from "../../interfaces";
import { Base58, BigNumber } from "../../utils";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class MultiPaymentTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.MultiPayment;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiPayment;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;
        const buffer: ByteBuffer = new ByteBuffer(64, true);

        buffer.writeUint32(data.asset.payments.length);

        for (const p of data.asset.payments) {
            buffer.writeUint64(+BigNumber.make(p.amount).toFixed());
            buffer.append(Base58.decodeCheck(p.recipientId));
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const payments: IMultiPaymentItem[] = [];
        const total: number = buf.readUint32();

        for (let j = 0; j < total; j++) {
            payments.push({
                amount: BigNumber.make(buf.readUint64().toString()),
                recipientId: Base58.encodeCheck(buf.readBytes(21).toBuffer()),
            });
        }

        data.amount = payments.reduce((a, p) => a.plus(p.amount), BigNumber.ZERO);
        data.asset = { payments };
    }
}
