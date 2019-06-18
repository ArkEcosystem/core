import ByteBuffer from "bytebuffer";
import { TransactionTypes } from "../../enums";
import { ISerializeOptions } from "../../interfaces";
import * as schemas from "./schemas";
import { Transaction } from "./transaction";

export class DelegateResignationTransaction extends Transaction {
    public static type: TransactionTypes = TransactionTypes.DelegateResignation;

    public static getSchema(): schemas.TransactionSchema {
        return schemas.delegateResignation;
    }

    public serialize(options?: ISerializeOptions): ByteBuffer {
        return new ByteBuffer(0);
    }

    public deserialize(buf: ByteBuffer): void {
        return;
    }
}
