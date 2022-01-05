import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions } from "../../../interfaces";
import { BigNumber, ByteBuffer } from "../../../utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class SecondSignatureRegistrationTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.SecondSignature;
    public static key = "secondSignature";
    public static version: number = 1;

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.secondSignature;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;
        const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(33));

        if (data.asset && data.asset.signature) {
            buff.writeBuffer(Buffer.from(data.asset.signature.publicKey, "hex"));
        }

        return buff;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        data.asset = {
            signature: {
                publicKey: buf.readBuffer(33).toString("hex"),
            },
        };
    }
}
