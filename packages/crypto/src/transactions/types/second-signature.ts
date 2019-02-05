import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { AbstractTransaction } from "./abstract";

export class SecondSignatureRegistrationTransaction extends AbstractTransaction {
    public static type: TransactionTypes = TransactionTypes.SecondSignature;

    public canBeApplied(wallet: any): boolean {
        return false;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer = new ByteBuffer(33, true);

        buffer.append(data.asset.signature.publicKey, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.asset = {
            signature: {
                publicKey: buf.readBytes(33).toString("hex"),
            },
        };
    }
}
