import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { Address } from "../../../identities";
import { IMultiPaymentItem, ISerializeOptions } from "../../../interfaces";
import { configManager } from "../../../managers";
import { BigNumber, ByteBuffer } from "../../../utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class MultiPaymentTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.MultiPayment;
    public static key = "multiPayment";
    public static version: number = 2;

    protected static defaultStaticFee: BigNumber = BigNumber.make("10000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiPayment;
    }

    public verify(): boolean {
        return configManager.getMilestone().aip11 && super.verify();
    }

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options: ISerializeOptions = {}): ByteBuffer | undefined {
        const { data } = this;

        if (data.asset && data.asset.payments) {
            const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(2 + data.asset.payments.length * 29));
            buff.writeUInt16LE(data.asset.payments.length);

            for (const payment of data.asset.payments) {
                buff.writeBigUInt64LE(payment.amount.toBigInt());

                const { addressBuffer, addressError } = Address.toBuffer(payment.recipientId);
                options.addressError = addressError || options.addressError;

                buff.writeBuffer(addressBuffer);
            }

            return buff;
        }

        return undefined;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const payments: IMultiPaymentItem[] = [];
        const total: number = buf.readUInt16LE();

        for (let j = 0; j < total; j++) {
            payments.push({
                amount: BigNumber.make(buf.readBigUInt64LE().toString()),
                recipientId: Address.fromBuffer(buf.readBuffer(21)),
            });
        }

        data.amount = BigNumber.ZERO;
        data.asset = { payments };
    }
}
