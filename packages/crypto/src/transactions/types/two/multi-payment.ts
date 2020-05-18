import ByteBuffer from "bytebuffer";

import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { IMultiPaymentItem, ISerializeOptions, SchemaError } from "../../../interfaces";
import { ITransactionData } from "../../../interfaces";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class MultiPaymentTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends Transaction<T, U, E> {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.MultiPayment;
    public static key = "multiPayment";
    public static version: number = 2;

    protected static defaultStaticFee: string = "10000000";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiPayment;
    }

    public verify(): boolean {
        return this.cryptoManager.MilestoneManager.getMilestone().aip11 && super.verify();
    }

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options: ISerializeOptions = {}): ByteBuffer | undefined {
        const { data } = this;

        if (data.asset && data.asset.payments) {
            const buffer: ByteBuffer = new ByteBuffer(2 + data.asset.payments.length * 29, true);
            buffer.writeUint16(data.asset.payments.length);

            for (const payment of data.asset.payments) {
                // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
                buffer.writeUint64(payment.amount.toString());

                const { addressBuffer, addressError } = this.cryptoManager.Identities.Address.toBuffer(
                    payment.recipientId,
                );
                options.addressError = addressError || options.addressError;

                buffer.append(addressBuffer);
            }

            return buffer;
        }

        return undefined;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const payments: IMultiPaymentItem[] = [];
        const total: number = buf.readUint16();

        for (let j = 0; j < total; j++) {
            payments.push({
                amount: this.cryptoManager.LibraryManager.Libraries.BigNumber.make(buf.readUint64().toString()),
                recipientId: this.cryptoManager.Identities.Address.fromBuffer(buf.readBytes(21).toBuffer()),
            });
        }

        data.amount = this.cryptoManager.LibraryManager.Libraries.BigNumber.ZERO;
        data.asset = { payments };
    }
}
