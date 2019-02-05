import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { NotImplementedError } from "../../errors";
import { Wallet } from "../../models";
import { AbstractTransaction } from "./abstract";

export class IpfsTransaction extends AbstractTransaction {
    public static type: TransactionTypes = TransactionTypes.Ipfs;

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

    public canBeApplied(wallet: Wallet): boolean {
        return super.canBeApplied(wallet);
    }

    protected apply(wallet: Wallet): void {
        throw new NotImplementedError();
    }
    protected revert(wallet: Wallet): void {
        throw new NotImplementedError();
    }
}
