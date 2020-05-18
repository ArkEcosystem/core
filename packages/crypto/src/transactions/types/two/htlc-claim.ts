import ByteBuffer from "bytebuffer";

import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions, ITransactionData, SchemaError } from "../../../interfaces";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class HtlcClaimTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends Transaction<T, U, E> {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.HtlcClaim;
    public static key = "htlcClaim";
    public static version: number = 2;

    protected static defaultStaticFee: number = 0;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.htlcClaim;
    }

    public verify(): boolean {
        const milestone = this.cryptoManager.MilestoneManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(32 + 32, true);

        if (data.asset && data.asset.claim) {
            buffer.append(Buffer.from(data.asset.claim.lockTransactionId, "hex"));
            buffer.append(Buffer.from(data.asset.claim.unlockSecret, "hex"));
        }

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
