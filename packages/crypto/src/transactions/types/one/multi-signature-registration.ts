import ByteBuffer from "bytebuffer";

import { CryptoManager } from "../../../crypto-manager";
import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { IMultiSignatureLegacyAsset, ISerializeOptions, ITransactionData, SchemaError } from "../../../interfaces";
import { BigNumber } from "../../../types";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class MultiSignatureRegistrationTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends Transaction<T, U, E> {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.MultiSignature;
    public static key = "multiSignature";
    public static version: number = 1;

    protected static defaultStaticFee: string = "500000000";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.multiSignatureLegacy;
    }

    public static staticFee<T, U extends ITransactionData>(
        cryptoManager: CryptoManager<T>,
        feeContext: { height?: number; data?: U } = {},
    ): BigNumber {
        if (feeContext.data?.asset?.multiSignatureLegacy) {
            return super
                .staticFee<T, U>(cryptoManager, feeContext)
                .times(feeContext.data.asset.multiSignatureLegacy.keysgroup.length + 1);
        }

        return super.staticFee<T, U>(cryptoManager, feeContext);
    }

    public verify(): boolean {
        return this.cryptoManager.LibraryManager.Utils.isException(this.data.id);
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        const legacyAsset: IMultiSignatureLegacyAsset = data.asset!.multiSignatureLegacy!;
        const joined: string = legacyAsset.keysgroup.map((k) => (k.startsWith("+") ? k.slice(1) : k)).join("");
        const keysgroupBuffer: Buffer = Buffer.from(joined, "hex");
        const buffer: ByteBuffer = new ByteBuffer(keysgroupBuffer.length + 3, true);

        buffer.writeByte(legacyAsset.min);
        buffer.writeByte(legacyAsset.keysgroup.length);
        buffer.writeByte(legacyAsset.lifetime);
        buffer.append(keysgroupBuffer, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

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
