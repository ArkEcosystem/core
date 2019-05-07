import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class DelegateResignationTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.DelegateResignation;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.delegateResignation;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const delegateBytes: Buffer = Buffer.from(this.data.asset.delegate.username, "utf8");
        const buffer: ByteBuffer = new ByteBuffer(delegateBytes.length, true);

        buffer.writeByte(delegateBytes.length);
        buffer.append(delegateBytes, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const usernamelength: number = buf.readUint8();

        this.data.asset = {
            delegate: {
                username: buf.readString(usernamelength),
            },
        };
    }
}
