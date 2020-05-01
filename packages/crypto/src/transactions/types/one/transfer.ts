import { CryptoManager } from "@packages/crypto/src";
import ByteBuffer from "bytebuffer";

import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions, ITransactionData } from "../../../interfaces";
import { Verifier } from "../../verifier";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class TransferTransaction<T, U extends ITransactionData, E> extends Transaction<T, U, E> {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.Transfer;
    public static key = "transfer";
    public static version: number = 1;
    protected static defaultStaticFee: string = "10000000";

    public constructor(protected cryptoManager: CryptoManager<T>, verifier: Verifier<T, U, E>) {
        super(cryptoManager, verifier);
    }

    public static getSchema(): schemas.TransactionSchema {
        return schemas.transfer;
    }

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;
        const buffer: ByteBuffer = new ByteBuffer(24, true);
        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(data.amount.toString());
        buffer.writeUint32(data.expiration || 0);

        if (data.recipientId) {
            const { addressBuffer, addressError } = this.cryptoManager.Identities.Address.toBuffer(data.recipientId);

            if (options) {
                options.addressError = addressError;
            }

            buffer.append(addressBuffer);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = this.cryptoManager.Identities.Address.fromBuffer(buf.readBytes(21).toBuffer());
    }
}
