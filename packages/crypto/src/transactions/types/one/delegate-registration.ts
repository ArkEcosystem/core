import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions } from "../../../interfaces";
import { BigNumber, ByteBuffer } from "../../../utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class DelegateRegistrationTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.DelegateRegistration;
    public static key = "delegateRegistration";
    public static version: number = 1;

    protected static defaultStaticFee: BigNumber = BigNumber.make("2500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.delegateRegistration;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        if (data.asset && data.asset.delegate) {
            const delegateBytes: Buffer = Buffer.from(data.asset.delegate.username, "utf8");
            const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(delegateBytes.length + 1));

            buff.writeUInt8(delegateBytes.length);
            // buffer.writeBuffer(delegateBytes, "hex");
            buff.writeBuffer(delegateBytes);

            return buff;
        }

        return undefined;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const usernameLength = buf.readUInt8();

        data.asset = {
            delegate: {
                username: buf.readBuffer(usernameLength).toString("utf8"),
            },
        };
    }
}
