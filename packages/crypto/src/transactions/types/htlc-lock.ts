import ByteBuffer from "bytebuffer";
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

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(8 + 32 + 4 + 8 + 21, true);

        buffer.writeUint64(+data.amount);
        buffer.append(Buffer.from(data.asset.lock.secretHash, "hex"));
        buffer.writeUint8(data.asset.lock.expiration.type);
        buffer.writeUint64(data.asset.lock.expiration.value);
        buffer.append(Base58.decodeCheck(data.recipientId));

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const amount = BigNumber.make(buf.readUint64().toString());
        const secretHash: string = buf.readBytes(32).toString("hex");
        const expirationType = buf.readUint8();
        const expirationValue = buf.readUint64().toNumber();
        const recipientId = Base58.encodeCheck(buf.readBytes(21).toBuffer());

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
