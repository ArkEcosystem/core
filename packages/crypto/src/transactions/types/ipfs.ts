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
        const buffer: ByteBuffer = new ByteBuffer(1 + data.asset.ipfs.dag.length / 2, true);

        buffer.writeByte(data.asset.ipfs.dag.length / 2);
        buffer.append(data.asset.ipfs.dag, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const dagLength: number = buf.readUint8();

        data.asset = {
            ipfs: {
                dag: buf.readBytes(dagLength).toString("hex"),
            },
        };
    }
}
