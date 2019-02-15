import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { WalletUsernameEmptyError, WalletUsernameNotEmptyError } from "../../errors";
import { Wallet } from "../../models";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class DelegateRegistrationTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.DelegateRegistration;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.delegateRegistration;
    }

    public serialize(): ByteBuffer {
        const { data } = this;
        const delegateBytes = Buffer.from(data.asset.delegate.username, "utf8");
        const buffer = new ByteBuffer(delegateBytes.length, true);

        buffer.writeByte(delegateBytes.length);
        buffer.append(delegateBytes, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        const usernamelength = buf.readUint8();

        data.asset = {
            delegate: {
                username: buf.readString(usernamelength),
            },
        };
    }

    public canBeApplied(wallet: Wallet): boolean {
        const username = this.data.asset.delegate.username;
        if (!username) {
            throw new WalletUsernameEmptyError();
        }

        if (wallet.username) {
            throw new WalletUsernameNotEmptyError();
        }

        return super.canBeApplied(wallet);
    }

    protected apply(wallet: Wallet): void {
        wallet.username = this.data.asset.delegate.username;
    }

    protected revert(wallet: Wallet): void {
        wallet.username = null;
    }
}
