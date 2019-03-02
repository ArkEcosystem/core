import ByteBuffer from "bytebuffer";
import { IMultiSignatureAsset } from "..";
import { TransactionTypes } from "../../constants";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class MultiSignatureRegistrationTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.MultiSignature;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiSignature;
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        const joined = data.asset.multisignature.keysgroup.map(k => (k[0] === "+" ? k.slice(1) : k)).join("");
        const keysgroupBuffer = Buffer.from(joined, "hex");
        const buffer = new ByteBuffer(keysgroupBuffer.length + 3, true);

        buffer.writeByte(data.asset.multisignature.min);
        buffer.writeByte(data.asset.multisignature.keysgroup.length);
        buffer.writeByte(data.asset.multisignature.lifetime);
        buffer.append(keysgroupBuffer, "hex");
        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.asset = { multisignature: { keysgroup: [] } as IMultiSignatureAsset };
        data.asset.multisignature.min = buf.readUint8();

        const num = buf.readUint8();
        data.asset.multisignature.lifetime = buf.readUint8();

        for (let index = 0; index < num; index++) {
            const key = buf.readBytes(33).toString("hex");
            data.asset.multisignature.keysgroup.push(key);
        }
    }
}
