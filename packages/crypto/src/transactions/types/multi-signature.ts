import ByteBuffer from "bytebuffer";
import { IMultiSignatureAsset } from "..";
import { TransactionTypes } from "../../constants";
import { NotImplementedError } from "../../errors";
import { Wallet } from "../../models";
import { AbstractTransaction } from "./abstract";

export class MultiSignatureRegistrationTransaction extends AbstractTransaction {
    public static type: TransactionTypes = TransactionTypes.MultiSignature;

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

    // TODO: AIP18
    public canBeApplied(wallet: Wallet): boolean {
        throw new NotImplementedError();
    }

    protected apply(wallet: Wallet): void {
        throw new NotImplementedError();
    }
    protected revert(wallet: Wallet): void {
        throw new NotImplementedError();
    }
}
