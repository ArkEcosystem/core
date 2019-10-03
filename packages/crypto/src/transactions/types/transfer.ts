import ByteBuffer from "bytebuffer";
import Long from "long";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import { Base58 } from "../../utils/base58";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class TransferTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.Transfer;
    public static key: string = "transfer";

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
        buffer.append(Base58.decodeCheck(data.recipientId));

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = BigNumber.make(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = Base58.encodeCheck(buf.readBytes(21).toBuffer());
    }
}
