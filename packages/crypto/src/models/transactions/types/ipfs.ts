import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../../constants";
import { AbstractTransaction } from "./abstract";

export class IpfsTransaction extends AbstractTransaction {
    public static getType(): TransactionTypes {
        return TransactionTypes.Ipfs;
    }

    public canBeApplied(wallet: any): boolean {
        return false;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer = new ByteBuffer(1 + data.asset.ipfs.dag.length / 2, true);

        buffer.writeByte(data.asset.ipfs.dag.length / 2);
        buffer.append(data.asset.ipfs.dag, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const dagLength = buf.readUint8();
        data.asset = {
            ipfs: {
                dag: buf.readBytes(dagLength).toString("hex"),
            },
        };
    }
}
