import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { AbstractTransaction } from "./abstract";

export class DelegateRegistrationTransaction extends AbstractTransaction {
    public static getType(): TransactionTypes {
        return TransactionTypes.DelegateRegistration;
    }

    public canBeApplied(wallet: any): boolean {
        return false;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const delegateBytes = Buffer.from(data.asset.delegate.username, "utf8");
        const buffer = new ByteBuffer(delegateBytes.length, true);

        buffer.writeByte(delegateBytes.length);
        buffer.append(delegateBytes, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const usernamelength = buf.readUint8();

        data.asset = {
            delegate: {
                username: buf.readString(usernamelength),
            },
        };
    }
}
