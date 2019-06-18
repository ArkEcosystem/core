import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import { IMultiSignatureAsset, IMultiSignatureLegacyAsset, ISerializeOptions } from "../../interfaces";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class MultiSignatureRegistrationTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.MultiSignature;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiSignature;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;

        let buffer: ByteBuffer;
        if (data.version === 2) {
            const { min, publicKeys } = data.asset.multiSignature;
            buffer = new ByteBuffer(2 + publicKeys.length * 33);

            buffer.writeUint8(min);
            buffer.writeUint8(publicKeys.length);

            for (const publicKey of publicKeys) {
                buffer.append(publicKey, "hex");
            }
        } else {
            // Legacy
            const joined: string = data.asset.multiSignatureLegacy.keysgroup
                .map(k => (k[0] === "+" ? k.slice(1) : k))
                .join("");
            const keysgroupBuffer: Buffer = Buffer.from(joined, "hex");

            buffer = new ByteBuffer(keysgroupBuffer.length + 3, true);
            buffer.writeByte(data.asset.multiSignatureLegacy.min);
            buffer.writeByte(data.asset.multiSignatureLegacy.keysgroup.length);
            buffer.writeByte(data.asset.multiSignatureLegacy.lifetime);
            buffer.append(keysgroupBuffer, "hex");
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        if (data.version === 2) {
            const multiSignature: IMultiSignatureAsset = { publicKeys: [], min: 0 };
            multiSignature.min = buf.readUint8();

            const count = buf.readUint8();
            for (let i = 0; i < count; i++) {
                const publicKey = buf.readBytes(33).toString("hex");
                multiSignature.publicKeys.push(publicKey);
            }

            data.asset = { multiSignature };
        } else {
            // Legacy
            const multiSignatureLegacy: IMultiSignatureLegacyAsset = { keysgroup: [], lifetime: 0, min: 0 };

            multiSignatureLegacy.min = buf.readUint8();

            const num: number = buf.readUint8();
            multiSignatureLegacy.lifetime = buf.readUint8();

            for (let index = 0; index < num; index++) {
                const key: string = buf.readBytes(33).toString("hex");
                multiSignatureLegacy.keysgroup.push(key);
            }

            data.asset = { multiSignatureLegacy };
        }
    }
}
