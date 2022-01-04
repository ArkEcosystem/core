import { base58 } from "bstring";

import { ByteBuffer } from "../../../byte-buffer";
import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions } from "../../../interfaces";
import { configManager } from "../../../managers";
import { BigNumber } from "../../../utils/bignum";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class IpfsTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.Ipfs;
    public static key = "ipfs";
    public static version: number = 2;

    protected static defaultStaticFee: BigNumber = BigNumber.make("500000000");

    public static getSchema(): schemas.TransactionSchema {
        return schemas.ipfs;
    }

    public verify(): boolean {
        return configManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        if (data.asset) {
            const ipfsBuffer: Buffer = base58.decode(data.asset.ipfs);
            const buffer: ByteBuffer = new ByteBuffer(Buffer.alloc(ipfsBuffer.length));

            buffer.writeBuffer(ipfsBuffer);

            return buffer;
        }

        return undefined;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const hashFunction: number = buf.readUInt8();
        const ipfsHashLength: number = buf.readUInt8();
        const ipfsHash: Buffer = buf.readBuffer(ipfsHashLength);

        const buffer: Buffer = Buffer.alloc(ipfsHashLength + 2);
        buffer.writeUInt8(hashFunction, 0);
        buffer.writeUInt8(ipfsHashLength, 1);
        buffer.fill(ipfsHash, 2);

        data.asset = {
            ipfs: base58.encode(buffer),
        };
    }
}
