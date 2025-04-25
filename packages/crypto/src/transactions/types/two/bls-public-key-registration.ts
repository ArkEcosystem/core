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

        if (data.asset) {
            // TODO: handle decoding
            const blsPublicKeyBytes = data.asset.blsPublicKey as unknown as Buffer;

            const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(96));
            buff.writeBuffer(blsPublicKeyBytes);

            return buff;
        }

        return undefined;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const blsPublicKeyBytes = buf.readBuffer(96);

        data.asset = {
            blsPublicKey: blsPublicKeyBytes.toString(), // TODO: handle encoding
        };
    }
}
