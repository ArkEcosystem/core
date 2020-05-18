import ByteBuffer from "bytebuffer";

import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions, SchemaError } from "../../../interfaces";
import { ITransactionData } from "../../../interfaces";
import { BigNumber } from "../../../types";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class HtlcLockTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends Transaction<T, U, E> {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.HtlcLock;
    public static key = "htlcLock";
    public static version: number = 2;

    protected static defaultStaticFee: string = "10000000";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.htlcLock;
    }

    public verify(): boolean {
        const milestone = this.cryptoManager.MilestoneManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true && super.verify();
    }

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(8 + 32 + 1 + 4 + 21, true);

        // @ts-ignore - The ByteBuffer types say we can't use strings but the code actually handles them.
        buffer.writeUint64(data.amount.toString());

        if (data.asset && data.asset.lock) {
            buffer.append(Buffer.from(data.asset.lock.secretHash, "hex"));
            buffer.writeUint8(data.asset.lock.expiration.type);
            buffer.writeUint32(data.asset.lock.expiration.value);
        }

        if (data.recipientId) {
            buffer.append(this.cryptoManager.Identities.Address.toBuffer(data.recipientId).addressBuffer);
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const amount: BigNumber = this.cryptoManager.LibraryManager.Libraries.BigNumber.make(
            buf.readUint64().toString(),
        );
        const secretHash: string = buf.readBytes(32).toString("hex");
        const expirationType: number = buf.readUint8();
        const expirationValue: number = buf.readUint32();
        const recipientId: string = this.cryptoManager.Identities.Address.fromBuffer(buf.readBytes(21).toBuffer());

        data.amount = amount;
        data.recipientId = recipientId;
        data.asset = {
            lock: {
                secretHash,
                expiration: {
                    type: expirationType,
                    value: expirationValue,
                },
            },
        };
    }
}
