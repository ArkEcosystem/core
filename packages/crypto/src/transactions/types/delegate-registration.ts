import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class DelegateRegistrationTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.DelegateRegistration;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.delegateRegistration;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const delegateBytes: Buffer = Buffer.from(data.asset.delegate.username, "utf8");
        const buffer: ByteBuffer = new ByteBuffer(delegateBytes.length, true);

        buffer.writeByte(delegateBytes.length);
        buffer.append(delegateBytes, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const usernamelength: number = buf.readUint8();

        data.asset = {
            delegate: {
                username: buf.readString(usernamelength),
            },
        };
    }
}
