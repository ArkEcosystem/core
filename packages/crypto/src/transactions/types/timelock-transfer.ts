import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import { Address } from "../../identities";
import { ISerializeOptions } from "../../interfaces";
import { BigNumber } from "../../utils";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class TimelockTransferTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.TimelockTransfer;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.timelockTransfer;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;
        const buffer: ByteBuffer = new ByteBuffer(4 + 1 + 4 + 24, true);

        buffer.writeUint64(+data.amount.toFixed());
        buffer.writeByte(data.timelockType);
        buffer.writeUint64(data.timelock);
        buffer.append(Address.decodeCheck(data.recipientId));
        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = BigNumber.make(buf.readUint64().toString());
        data.timelockType = buf.readUint8();
        data.timelock = buf.readUint64().toNumber();
        data.recipientId = Address.encodeCheck(buf.readBytes(21).toBuffer());
    }
}
