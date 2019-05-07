import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class SecondSignatureRegistrationTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.SecondSignature;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.secondSignature;
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
