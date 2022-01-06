import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { Address } from "../../../identities";
import { ISerializeOptions } from "../../../interfaces";
import { configManager } from "../../../managers";
import { BigNumber, ByteBuffer } from "../../../utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class HtlcLockTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.HtlcLock;
    public static key = "htlcLock";
    public static version: number = 2;

    protected static defaultStaticFee: BigNumber = BigNumber.make("10000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.htlcLock;
    }

    public verify(): boolean {
        const milestone = configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true && super.verify();
    }

    public hasVendorField(): boolean {
        return true;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(8 + 32 + 1 + 4 + 21));

        buff.writeBigUInt64LE(data.amount.toBigInt());

        if (data.asset && data.asset.lock) {
            buff.writeBuffer(Buffer.from(data.asset.lock.secretHash, "hex"));
            buff.writeUInt8(data.asset.lock.expiration.type);
            buff.writeUInt32LE(data.asset.lock.expiration.value);
        }

        if (data.recipientId) {
            const { addressBuffer, addressError } = Address.toBuffer(data.recipientId);

            if (options) {
                options.addressError = addressError;
            }

            buff.writeBuffer(addressBuffer);
        }

        return buff;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const amount: BigNumber = BigNumber.make(buf.readBigUInt64LE().toString());
        const secretHash: string = buf.readBuffer(32).toString("hex");
        const expirationType: number = buf.readUInt8();
        const expirationValue: number = buf.readUInt32LE();
        const recipientId: string = Address.fromBuffer(buf.readBuffer(21));

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
