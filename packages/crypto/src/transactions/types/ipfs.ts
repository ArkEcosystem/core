import { base58 } from "bstring";
import ByteBuffer from "bytebuffer";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import { configManager } from "../../managers";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class IpfsTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.Ipfs;
    public static key: string = "ipfs";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.ipfs;
    }

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public verify(): boolean {
        return configManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;

        const ipfsBuffer: Buffer = base58.decode(data.asset.ipfs);
        const buffer: ByteBuffer = new ByteBuffer(ipfsBuffer.length, true);

        buffer.append(ipfsBuffer, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const hashFunction: number = buf.readUint8();
        const ipfsHashLength: number = buf.readUint8();
        const ipfsHash: Buffer = buf.readBytes(ipfsHashLength).toBuffer();

        const buffer: Buffer = Buffer.alloc(ipfsHashLength + 2);
        buffer.writeUInt8(hashFunction, 0);
        buffer.writeUInt8(ipfsHashLength, 1);
        buffer.fill(ipfsHash, 2);

        data.asset = {
            ipfs: base58.encode(buffer),
        };
    }
}
