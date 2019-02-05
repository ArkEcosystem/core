import ByteBuffer from "bytebuffer";
import { IMultiSignatureAsset } from "..";
import { TransactionTypes } from "../../../constants";
import { AbstractTransaction } from "./abstract";

export class MultiSignatureRegistrationTransaction extends AbstractTransaction {
    public static getType(): TransactionTypes {
        return TransactionTypes.MultiSignature;
    }

    public canBeApplied(wallet: any): boolean {
        return false;
    }

    public serialize(): ByteBuffer {
        const { data } = this;

        let joined = null;

        if (!data.version || data.version === 1) {
            joined = data.asset.multisignature.keysgroup.map(k => (k[0] === "+" ? k.slice(1) : k)).join("");
        } else {
            joined = data.asset.multisignature.keysgroup.join("");
        }

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
