import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { NotImplementedError, WalletNoUsernameDelegateResignationError } from "../../errors";
import { Wallet } from "../../models";
import { AbstractTransaction } from "./abstract";

export class DelegateResignationTransaction extends AbstractTransaction {
    public static type: TransactionTypes = TransactionTypes.DelegateResignation;

    public serialize(): ByteBuffer {
        return new ByteBuffer(0);
    }

    public deserialize(buf: ByteBuffer): void {
        return;
    }

    public canBeApplied(wallet: Wallet): boolean {
        if (!wallet.username) {
            throw new WalletNoUsernameDelegateResignationError();
        }

        return super.canBeApplied(wallet);
    }

    protected apply(wallet: Wallet): void {
        throw new NotImplementedError();
    }
    protected revert(wallet: Wallet): void {
        throw new NotImplementedError();
    }
}
