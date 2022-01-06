import { Transactions, Utils } from "@arkecosystem/crypto";

import { MagistrateTransactionGroup, MagistrateTransactionStaticFees, MagistrateTransactionType } from "../enums";

const { schemas } = Transactions;

export class BusinessResignationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MagistrateTransactionGroup;
    public static type: number = MagistrateTransactionType.BusinessResignation;
    public static key: string = "businessResignation";
    public static version: number = 2;

    protected static defaultStaticFee = Utils.BigNumber.make(MagistrateTransactionStaticFees.BusinessResignation);

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessResignation",
            required: ["typeGroup"],
            properties: {
                type: { transactionType: MagistrateTransactionType.BusinessResignation },
                typeGroup: { const: MagistrateTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
            },
        });
    }
    public serialize(): Utils.ByteBuffer {
        return new Utils.ByteBuffer(Buffer.alloc(0));
    }

    public deserialize(buf: Utils.ByteBuffer): void {
        return;
    }
}
