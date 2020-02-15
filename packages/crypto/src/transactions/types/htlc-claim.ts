import ByteBuffer from "bytebuffer";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import { configManager } from "../../managers";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class HtlcClaimTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.HtlcClaim;
    public static key: string = "htlcClaim";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.htlcClaim;
    }

    protected static defaultStaticFee: BigNumber = BigNumber.ZERO;

    public verify(): boolean {
        const milestone = configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(32 + 32, true);

        buffer.append(Buffer.from(data.asset.claim.lockTransactionId, "hex"));
        buffer.append(Buffer.from(data.asset.claim.unlockSecret, "hex"));

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const lockTransactionId: string = buf.readBytes(32).toString("hex");
        const unlockSecret: string = buf.readBytes(32).toString("hex");

        data.asset = {
            claim: {
                lockTransactionId,
                unlockSecret,
            },
        };
    }
}
