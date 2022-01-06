import { base58 } from "bstring";

import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions } from "../../../interfaces";
import { configManager } from "../../../managers";
import { BigNumber, ByteBuffer } from "../../../utils";
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
            const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(ipfsBuffer.length));

            buff.writeBuffer(ipfsBuffer);

            return buff;
        }

        return undefined;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const hashFunction: number = buf.readUInt8();
        const ipfsHashLength: number = buf.readUInt8();
        const ipfsHash: Buffer = buf.readBuffer(ipfsHashLength);

        const buff: Buffer = Buffer.alloc(ipfsHashLength + 2);
        buff.writeUInt8(hashFunction, 0);
        buff.writeUInt8(ipfsHashLength, 1);
        buff.fill(ipfsHash, 2);

        data.asset = {
            ipfs: base58.encode(buff),
        };
    }
}
