import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { AbstractTransaction } from "./abstract";

export class DelegateResignationTransaction extends AbstractTransaction {
    public static getType(): TransactionTypes {
        return TransactionTypes.DelegateResignation;
    }

    public canBeApplied(wallet: any): boolean {
        return false;
    }

    public serialize(): ByteBuffer {
        return new ByteBuffer(0);
    }

    public deserialize(buf: ByteBuffer): void {
        return;
    }
}
