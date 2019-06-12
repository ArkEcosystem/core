import bs58 from "bs58";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class IpfsTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.Ipfs;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.ipfs;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;

        const ipfsBuffer: Buffer = bs58.decode(data.asset.ipfs);
        const buffer: ByteBuffer = new ByteBuffer(ipfsBuffer.length, true);

        buffer.append(ipfsBuffer, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const hashFunction: number = buf.readUint8();
        const ipfsHashLength: number = buf.readUint8();
        const ipfsHash: Buffer = buf.readBytes(ipfsHashLength).toBuffer();

        const buffer: Buffer = new Buffer(ipfsHashLength + 2);
        buffer.writeUInt8(hashFunction, 0);
        buffer.writeUInt8(ipfsHashLength, 1);
        buffer.fill(ipfsHash, 2);

        data.asset = {
            ipfs: bs58.encode(buffer),
        };
    }
}
