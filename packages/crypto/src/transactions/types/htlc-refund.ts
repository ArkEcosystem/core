import ByteBuffer from "bytebuffer";
import { TransactionType, TransactionTypeGroup } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import { configManager } from "../../managers";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class HtlcRefundTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.HtlcRefund;
    public static key: string = "htlcRefund";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.htlcRefund;
    }

    protected static defaultStaticFee: BigNumber = BigNumber.ZERO;

    public verify(): boolean {
        return configManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        const { data } = this;

        const buffer: ByteBuffer = new ByteBuffer(32, true);

        buffer.append(Buffer.from(data.asset.refund.lockTransactionId, "hex"));

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
