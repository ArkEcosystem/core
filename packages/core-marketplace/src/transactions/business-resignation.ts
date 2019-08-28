import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MarketplaceTransactionGroup, MarketplaceTransactionStaticFees, MarketplaceTransactionType } from "../enums";

const { schemas } = Transactions;

export class BusinessResignationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MarketplaceTransactionGroup;
    public static type: number = MarketplaceTransactionType.BusinessResignation;
    public static key: string = "businessResignation";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessResignation",
            required: ["typeGroup"],
            properties: {
                type: { transactionType: MarketplaceTransactionType.BusinessResignation },
                typeGroup: { const: MarketplaceTransactionGroup },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MarketplaceTransactionStaticFees.BusinessResignation);

    public serialize(): ByteBuffer {
        return new ByteBuffer(0);
    }

    public deserialize(buf: ByteBuffer): void {
        return;
    }
}
