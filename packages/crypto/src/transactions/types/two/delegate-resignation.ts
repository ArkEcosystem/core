import ByteBuffer from "bytebuffer";

import { CryptoManager } from "../../../crypto-manager";
import { TransactionType, TransactionTypeGroup } from "../../../enums";
import { ISerializeOptions, ITransactionData, SchemaError } from "../../../interfaces";
import { Verifier } from "../../verifier";
import * as schemas from "../schemas";
import { Transaction } from "../transaction";

export abstract class DelegateResignationTransaction<
    T,
    U extends ITransactionData = ITransactionData,
    E = SchemaError
> extends Transaction<T, U, E> {
    public static typeGroup: number = TransactionTypeGroup.Core;
    public static type: number = TransactionType.DelegateResignation;
    public static key = "delegateResignation";
    public static version: number = 2;

    protected static defaultStaticFee: string = "2500000000";

    public constructor(protected cryptoManager: CryptoManager<T>, verifier: Verifier<T, U, E>) {
        super(cryptoManager, verifier);
    }

    public static getSchema(): schemas.TransactionSchema {
        return schemas.delegateResignation;
    }

    public verify(): boolean {
        return this.cryptoManager.MilestoneManager.getMilestone().aip11 && super.verify();
    }

    public serialize(options?: ISerializeOptions): ByteBuffer | undefined {
        return new ByteBuffer(0);
    }

    public deserialize(buf: ByteBuffer): void {
        return;
    }
}
