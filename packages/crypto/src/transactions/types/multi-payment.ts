import ByteBuffer from "bytebuffer";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import { Address } from "../../identities";
import { IMultiPaymentItem, ISerializeOptions } from "../../interfaces";
import { configManager } from "../../managers";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class MultiPaymentTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.MultiPayment;
    public static key: string = "multiPayment";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiPayment;
    }

    protected static defaultStaticFee: BigNumber = BigNumber.make("10000000");

    public verify(): boolean {
        return configManager.getMilestone().aip11 && super.verify();
    }

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(2 + data.asset.payments.length * 29, true);
        buffer.writeUint16(data.asset.payments.length);

        for (const payment of data.asset.payments) {
            // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
            buffer.writeUint64(payment.amount.toString());

            const { addressBuffer, addressError } = Address.toBuffer(payment.recipientId);
            options.addressError = addressError || options.addressError;

            buffer.append(addressBuffer);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const payments: IMultiPaymentItem[] = [];
        const total: number = buf.readUint16();

        for (let j = 0; j < total; j++) {
            payments.push({
                amount: BigNumber.make(buf.readUint64().toString()),
                recipientId: Address.fromBuffer(buf.readBytes(21).toBuffer()),
            });
        }

        data.amount = BigNumber.ZERO;
        data.asset = { payments };
    }
}
