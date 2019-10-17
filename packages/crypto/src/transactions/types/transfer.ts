import ByteBuffer from "bytebuffer";
import Long from "long";

import { TransactionType, TransactionTypeGroup } from "../../enums";
import { Address } from "../../identities";
import { ISerializeOptions } from "../../interfaces";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class TransferTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.Transfer;
    public static key = "transfer";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.transfer;
    }

    protected static defaultStaticFee: BigNumber = BigNumber.make("10000000");

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;
        const buffer: ByteBuffer = new ByteBuffer(24, true);
        buffer.writeUint64(Long.fromString(data.amount.toString()));
        buffer.writeUint32(data.expiration || 0);

        const { addressBuffer, addressError } = Address.toBuffer(data.recipientId);
        options.addressError = addressError;

        buffer.append(addressBuffer);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = BigNumber.make(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = Address.fromBuffer(buf.readBytes(21).toBuffer());
    }
}
