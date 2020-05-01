import ByteBuffer from "bytebuffer";

import { CryptoManager } from "../../../crypto-manager";
import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions } from "../../../interfaces";
import { ITransactionData } from "../../../interfaces";
import { Verifier } from "../../verifier";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class HtlcRefundTransaction<T, U extends ITransactionData, E> extends Transaction<T, U, E> {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.HtlcRefund;
    public static key = "htlcRefund";
    public static version: number = 2;

    protected static defaultStaticFee: number = 0;

    public constructor(protected cryptoManager: CryptoManager<T>, verifier: Verifier<T, U, E>) {
        super(cryptoManager, verifier);
    }

    public static getSchema(): schemas.TransactionSchema {
        return schemas.htlcRefund;
    }

    public verify(): boolean {
        const milestone = this.cryptoManager.MilestoneManager.getMilestone();
        return milestone.aip11 === true && milestone.htlcEnabled === true && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(32, true);

        if (data.asset && data.asset.refund) {
            buffer.append(Buffer.from(data.asset.refund.lockTransactionId, "hex"));
        }

        return buffer;
    }

    public deserialize(buf: ByteBuffer): void {
        const { data } = this;

        const lockTransactionId: string = buf.readBytes(32).toString("hex");

        data.asset = {
            refund: {
                lockTransactionId,
            },
        };
    }
}
