import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions } from "../../../interfaces";
import { configManager } from "../../../managers";
import { BigNumber, ByteBuffer } from "../../../utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export class BlsPublicKeyRegistrationTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.BlsPublicKeyRegistration;
    public static key = "blsPublicKeyRegistration";
    public static version: number = 2;

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.blsPublicKeyRegistration;
    }

    public verify(): boolean {
        return configManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        if (data.asset && data.asset.blsPublicKey) {
            const bufferSize = data.asset.blsPublicKey.oldBlsPublicKey ? 48 + 48 + 1 : 48 + 1;

            const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(bufferSize));

            if (data.asset.blsPublicKey.oldBlsPublicKey) {
                buff.writeInt8(1);
                buff.writeBuffer(Buffer.from(data.asset.blsPublicKey.oldBlsPublicKey, "hex"));
                buff.writeBuffer(Buffer.from(data.asset.blsPublicKey.newBlsPublicKey, "hex"));
            } else {
                buff.writeInt8(0);
                buff.writeBuffer(Buffer.from(data.asset.blsPublicKey.newBlsPublicKey, "hex"));
            }

            return buff;
        }

        return undefined;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const oldExists: number = buf.readInt8();

        if (oldExists === 1) {
            data.asset = {
                blsPublicKey: {
                    oldBlsPublicKey: buf.readBuffer(48).toString("hex"),
                    newBlsPublicKey: buf.readBuffer(48).toString("hex"),
                },
            };
        } else {
            data.asset = {
                blsPublicKey: {
                    oldBlsPublicKey: undefined,
                    newBlsPublicKey: buf.readBuffer(48).toString("hex"),
                },
            };
        }
    }
}
