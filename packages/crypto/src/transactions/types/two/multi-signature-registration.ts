import { ByteBuffer } from "../../../byte-buffer";
import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { IMultiSignatureAsset, ISerializeOptions, ITransactionData } from "../../../interfaces";
import { configManager } from "../../../managers";
import { BigNumber } from "../../../utils/bignum";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export class MultiSignatureRegistrationTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.MultiSignature;
    public static key = "multiSignature";
    public static version: number = 2;

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiSignature;
    }

    public static staticFee(feeContext: { height?: number; data?: ITransactionData } = {}): BigNumber {
        if (feeContext.data?.asset?.multiSignature) {
            return super.staticFee(feeContext).times(feeContext.data.asset.multiSignature.publicKeys.length + 1);
        }

        return super.staticFee(feeContext);
    }

    public verify(): boolean {
        return configManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;
        const { min, publicKeys } = data.asset!.multiSignature!;
        const buffer: ByteBuffer = new ByteBuffer(Buffer.alloc(2 + publicKeys.length * 33));

        buffer.writeUInt8(min);
        buffer.writeUInt8(publicKeys.length);

        for (const publicKey of publicKeys) {
            buffer.writeBuffer(Buffer.from(publicKey, "hex"));
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const multiSignature: IMultiSignatureAsset = { publicKeys: [], min: 0 };
        multiSignature.min = buf.readUInt8();

        const count = buf.readUInt8();
        for (let i = 0; i < count; i++) {
            const publicKey = buf.readBuffer(33).toString("hex");
            multiSignature.publicKeys.push(publicKey);
        }

        data.asset = { multiSignature };
    }
}
