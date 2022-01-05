import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { IMultiSignatureLegacyAsset, ISerializeOptions, ITransactionData } from "../../../interfaces";
import { isException } from "../../../utils";
import { BigNumber, ByteBuffer } from "../../../utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class MultiSignatureRegistrationTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.MultiSignature;
    public static key = "multiSignature";
    public static version: number = 1;

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiSignatureLegacy;
    }

    public static staticFee(feeContext: { height?: number; data?: ITransactionData } = {}): BigNumber {
        if (feeContext.data?.asset?.multiSignatureLegacy) {
            return super.staticFee(feeContext).times(feeContext.data.asset.multiSignatureLegacy.keysgroup.length + 1);
        }

        return super.staticFee(feeContext);
    }

    public verify(): boolean {
        return isException(this.data);
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        const legacyAsset: IMultiSignatureLegacyAsset = data.asset!.multiSignatureLegacy!;
        const joined: string = legacyAsset.keysgroup.map((k) => (k.startsWith("+") ? k.slice(1) : k)).join("");
        const keysgroupBuffer: Buffer = Buffer.from(joined, "hex");
        const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(keysgroupBuffer.length + 3));

        buff.writeUInt8(legacyAsset.min);
        buff.writeUInt8(legacyAsset.keysgroup.length);
        buff.writeUInt8(legacyAsset.lifetime);
        buff.writeBuffer(keysgroupBuffer);

        return buff;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const multiSignatureLegacy: IMultiSignatureLegacyAsset = { keysgroup: [], lifetime: 0, min: 0 };
        multiSignatureLegacy.min = buf.readUInt8();

        const num = buf.readUInt8();
        multiSignatureLegacy.lifetime = buf.readUInt8();

        for (let index = 0; index < num; index++) {
            const key: string = buf.readBuffer(33).toString("hex");
            multiSignatureLegacy.keysgroup.push(key);
        }

        data.asset = { multiSignatureLegacy };
    }
}
