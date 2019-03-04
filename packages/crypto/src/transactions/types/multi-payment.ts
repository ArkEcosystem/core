import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { Bignum } from "../../utils";
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
            buffer.writeUint64(+new Bignum(p.amount).toFixed());
            buffer.append(bs58check.decode(p.recipientId));
        });

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const payments = [];
        const total = buf.readUint32();

        for (let j = 0; j < total; j++) {
            const payment: any = {};
            payment.amount = new Bignum(buf.readUint64().toString());
            payment.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
            payments.push(payment);
        }

        data.amount = payments.reduce((a, p) => a.plus(p.amount), Bignum.ZERO);
        data.asset = { payments };
    }
}
