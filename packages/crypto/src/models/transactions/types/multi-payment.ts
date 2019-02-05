import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../../constants";
import { Bignum } from "../../../utils";
import { AbstractTransaction } from "./abstract";

export class MultiPaymentTransaction extends AbstractTransaction {
    public static getType(): TransactionTypes {
        return TransactionTypes.MultiPayment;
    }

    public canBeApplied(wallet: any): boolean {
        return false;
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
