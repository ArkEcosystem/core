import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { EmptyUsernameDelegateRegistrationError, WalletUsernameDelegateRegistrationError } from "../../errors";
import { Wallet } from "../../models";
import { AbstractTransaction } from "./abstract";

export class DelegateRegistrationTransaction extends AbstractTransaction {
    public static type: TransactionTypes = TransactionTypes.DelegateRegistration;

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
            throw new EmptyUsernameDelegateRegistrationError();
        }

        if (wallet.username) {
            throw new WalletUsernameDelegateRegistrationError();
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
