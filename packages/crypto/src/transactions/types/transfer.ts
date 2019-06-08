import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import { Base58, BigNumber } from "../../utils";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class TransferTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.Transfer;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.transfer;
    }

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;
        const buffer: ByteBuffer = new ByteBuffer(24, true);
        buffer.writeUint64(+data.amount);
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
