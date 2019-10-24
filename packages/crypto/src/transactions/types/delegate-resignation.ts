import ByteBuffer from "bytebuffer";

import { TransactionType, TransactionTypeGroup } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import { configManager } from "../../managers";
import { BigNumber } from "../../utils/bignum";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class DelegateResignationTransaction extends Transaction {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.DelegateResignation;
    public static key = "delegateResignation";

    public static getSchema(): schemas.TransactionSchema {
        return schemas.delegateResignation;
    }

    protected static defaultStaticFee: BigNumber = BigNumber.make("2500000000");

    public verify(): boolean {
        return configManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        return new ByteBuffer(0);
    }

    public deserialize(buf: ByteBuffer): void {
        return;
    }
}
