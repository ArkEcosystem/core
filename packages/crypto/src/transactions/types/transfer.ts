import bs58check from "bs58check";
import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { Wallet } from "../../models";
import { Bignum } from "../../utils";
import { AbstractTransaction } from "./abstract";

export class TransferTransaction extends AbstractTransaction {
    public static type: TransactionTypes = TransactionTypes.Transfer;

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer = new ByteBuffer(24, true);
        buffer.writeUint64(+new Bignum(data.amount).toFixed());
        buffer.writeUint32(data.expiration || 0);
        buffer.append(bs58check.decode(data.recipientId));

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.amount = new Bignum(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
    }

    public canBeApplied(wallet: Wallet): boolean {
        return super.canBeApplied(wallet);
    }

    protected apply(wallet: Wallet): void {
        return;
    }

    protected revert(wallet: Wallet): void {
        return;
    }

    protected hasVendorField(): boolean {
        return true;
    }
}
