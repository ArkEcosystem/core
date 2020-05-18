import ByteBuffer from "bytebuffer";

import { CryptoManager } from "../../../crypto-manager";
import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { IMultiSignatureAsset, ISerializeOptions, SchemaError } from "../../../interfaces";
import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../types";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export class MultiSignatureRegistrationTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends Transaction<T, U, E> {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.MultiSignature;
    public static key = "multiSignature";
    public static version: number = 2;

    protected static defaultStaticFee: string = "500000000";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiSignature;
    }

    public static staticFee<T, U extends ITransactionData>(
        cryptoManager: CryptoManager<T>,
        feeContext: { height?: number; data?: U } = {},
    ): BigNumber {
        if (feeContext.data?.asset?.multiSignature) {
            return super
                .staticFee<T, U>(cryptoManager, feeContext)
                .times(feeContext.data.asset.multiSignature.publicKeys.length + 1);
        }

        return super.staticFee<T, U>(cryptoManager, feeContext);
    }

    public verify(): boolean {
        return this.cryptoManager.MilestoneManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;
        const { min, publicKeys } = data.asset!.multiSignature!;
        const buffer: ByteBuffer = new ByteBuffer(2 + publicKeys.length * 33);

        buffer.writeUint8(min);
        buffer.writeUint8(publicKeys.length);

        for (const publicKey of publicKeys) {
            buffer.append(publicKey, "hex");
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const multiSignature: IMultiSignatureAsset = { publicKeys: [], min: 0 };
        multiSignature.min = buf.readUint8();

        const count = buf.readUint8();
        for (let i = 0; i < count; i++) {
            const publicKey = buf.readBytes(33).toString("hex");
            multiSignature.publicKeys.push(publicKey);
        }

        data.asset = { multiSignature };
    }
}
