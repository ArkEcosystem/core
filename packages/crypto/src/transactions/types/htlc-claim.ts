import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class HtlcClaimTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.HtlcClaim;
    public static key: string = "htlcClaim";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.htlcClaim;
    }

    protected static defaultStaticFee: BigNumber = BigNumber.ZERO;

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(32 + 32, true);

        buffer.append(Buffer.from(data.asset.claim.lockTransactionId, "hex"));
        buffer.writeString(data.asset.claim.unlockSecret);

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const lockTransactionId: string = buf.readBytes(32).toString("hex");
        const unlockSecret: string = buf.readString(32);

        data.asset = {
            claim: {
                lockTransactionId,
                unlockSecret,
            },
        };
    }
}
