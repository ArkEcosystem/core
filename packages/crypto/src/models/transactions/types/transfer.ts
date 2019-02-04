import bs58check from "bs58check";
import { TransactionTypes } from "../../../constants";
import { Bignum } from "../../../utils";
import { ITransactionData } from "../interfaces";
import { AbstractTransaction } from "./abstract";

export class TransferTransaction extends AbstractTransaction {
    public static getType(): TransactionTypes {
        return TransactionTypes.Transfer;
    }

    public serialize(): Buffer {
        throw new Error("Method not implemented.");
    }
    public deserialize(data: ITransactionData, buf: ByteBuffer): void {
        data.amount = new Bignum(buf.readUint64().toString());
        data.expiration = buf.readUint32();
        data.recipientId = bs58check.encode(buf.readBytes(21).toBuffer());
    }

    protected hasVendorField(): boolean {
        return true;
    }
}
