import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../../constants";
import { Bignum } from "../../../utils";
import { AbstractTransaction } from "./abstract";

export class TimelockTransferTransaction extends AbstractTransaction {
    public static getType(): TransactionTypes {
        return TransactionTypes.TimelockTransfer;
    }

    public canBeApplied(wallet: any): boolean {
        return false;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer = new ByteBuffer(4 + 1 + 4 + 24, true);

        buffer.writeUint64(+new Bignum(data.amount).toFixed());
        buffer.writeByte(data.timelockType);
        buffer.writeUint64(data.timelock);
        buffer.append(bs58check.decode(data.recipientId));
        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = new Bignum(buf.readUint64().toString());
        data.timelockType = buf.readUint8();
        data.timelock = buf.readUint64().toNumber();
        data.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
    }
}
