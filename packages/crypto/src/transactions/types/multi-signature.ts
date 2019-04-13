import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class MultiSignatureRegistrationTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.MultiSignature;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiSignature;
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        const { min, publicKeys } = data.asset.multisignature;
        const buffer = new ByteBuffer(2 + publicKeys.length * 33);

        buffer.writeUint8(min);
        buffer.writeUint8(publicKeys.length);

        for (const publicKey of publicKeys) {
            buffer.append(publicKey, "hex");
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const asset = { multisignature: { publicKeys: [], min: 0 } };
        asset.multisignature.min = buf.readUint8();

        const count = buf.readUint8();
        for (let i = 0; i < count; i++) {
            const publicKey = buf.readBytes(33).toString("hex");
            data.asset.multisignature.publicKeys.push(publicKey);
        }
    }
}
