import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { NotImplementedError, WalletNoUsernameDelegateResignationError } from "../../errors";
import { TransactionSchemaConstructor, Wallet } from "../../models";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class DelegateResignationTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.DelegateResignation;

    protected static getTypeSchema(): TransactionSchemaConstructor {
        return schemas.delegateResignation;
    }

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
