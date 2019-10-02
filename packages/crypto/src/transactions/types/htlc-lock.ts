import ByteBuffer from "bytebuffer";
import Long from "long";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import { configManager } from "../../managers";
import { Base58 } from "../../utils/base58";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class HtlcLockTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.HtlcLock;
    public static key: string = "htlcLock";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.htlcLock;
    }

    protected static defaultStaticFee: BigNumber = BigNumber.make("10000000");

    public verify(): boolean {
        return configManager.getMilestone().aip11 && super.verify();
    }

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(8 + 32 + 1 + 4 + 21, true);

        buffer.writeUint64(Long.fromString(data.amount.toString()));
        buffer.append(Buffer.from(data.asset.lock.secretHash, "hex"));
        buffer.writeUint8(data.asset.lock.expiration.type);
        buffer.writeUint32(data.asset.lock.expiration.value);
        buffer.append(Base58.decodeCheck(data.recipientId));

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const amount: BigNumber = BigNumber.make(buf.readUint64().toString());
        const secretHash: string = buf.readBytes(32).toString("hex");
        const expirationType: number = buf.readUint8();
        const expirationValue: number = buf.readUint32();
        const recipientId: string = Base58.encodeCheck(buf.readBytes(21).toBuffer());

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
