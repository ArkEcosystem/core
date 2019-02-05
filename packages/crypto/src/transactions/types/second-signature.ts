import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../constants";
import { SecondSignatureAlreadyRegisteredError } from "../../errors";
import { Wallet } from "../../models";
import { AbstractTransaction } from "./abstract";

export class SecondSignatureRegistrationTransaction extends AbstractTransaction {
    public static type: TransactionTypes = TransactionTypes.SecondSignature;

    public serialize(): ByteBuffer {
        const { data } = this;
        const buffer = new ByteBuffer(33, true);

        buffer.append(data.asset.signature.publicKey, "hex");

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;
        data.asset = {
            signature: {
                publicKey: buf.readBytes(33).toString("hex"),
            },
        };
    }

    public canBeApplied(wallet: Wallet): boolean {
        if (wallet.secondPublicKey) {
            throw new SecondSignatureAlreadyRegisteredError();
        }

        return super.canBeApplied(wallet);
    }

    protected apply(wallet: Wallet): void {
        wallet.secondPublicKey = this.data.asset.signature.publicKey;
    }

    protected revert(wallet: Wallet): void {
        wallet.secondPublicKey = null;
    }
}
