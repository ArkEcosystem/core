import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions } from "../../../interfaces";
import { configManager } from "../../../managers";
import { BigNumber, ByteBuffer } from "../../../utils";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class HtlcClaimTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.HtlcClaim;
    public static key = "htlcClaim";
    public static version: number = 2;

    protected static defaultStaticFee: BigNumber = BigNumber.ZERO;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.htlcClaim;
    }

    public verify(): boolean {
        const milestone = configManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        const buff: ByteBuffer = new ByteBuffer(Buffer.alloc(32 + 32));

        if (data.asset && data.asset.claim) {
            buff.writeBuffer(Buffer.from(data.asset.claim.lockTransactionId, "hex"));
            buff.writeBuffer(Buffer.from(data.asset.claim.unlockSecret, "hex"));
        }

        return buff;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const lockTransactionId: string = buf.readBuffer(32).toString("hex");
        const unlockSecret: string = buf.readBuffer(32).toString("hex");

        data.asset = {
            claim: {
                lockTransactionId,
                unlockSecret,
            },
        };
    }
}
