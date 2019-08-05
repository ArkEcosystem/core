import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import { MarketplaceTransactionsGroup, MarketplaceTransactionTypes } from "../marketplace-transactions";

const { schemas } = Transactions;

const businessResignationType: number = MarketplaceTransactionTypes.BusinessResignation;

export class BusinessResignationTransaction extends Transactions.Transaction {
    public static typeGroup: number = MarketplaceTransactionsGroup;
    public static type = businessResignationType;
    public static key: string = "businessResignation";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "businessResignation",
            properties: {
                type: { transactionType: businessResignationType },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
            },
        });
    }
    protected static defaultStaticFee: Utils.BigNumber = Utils.BigNumber.make("5000000000");

    public serialize(): ByteBuffer {
        return new ByteBuffer(0);
    }

    public deserialize(buf: ByteBuffer): void {
        return;
    }
}
