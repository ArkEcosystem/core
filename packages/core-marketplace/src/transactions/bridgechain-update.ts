import { Transactions, Utils } from "@arkecosystem/crypto";
import ByteBuffer from "bytebuffer";
import {
    MarketplaceTransactionsGroup,
    MarketplaceTransactionStaticFees,
    MarketplaceTransactionTypes,
} from "../marketplace-transactions";

const { schemas } = Transactions;

const bridgechainUpdateType: number = MarketplaceTransactionTypes.BridgechainUpdate;

export class BridgechainUpdateTransaction extends Transactions.Transaction {
    public static typeGroup: number = MarketplaceTransactionsGroup;
    public static type = bridgechainUpdateType;
    public static key: string = "bridgechainUpdate";

    public static getSchema(): Transactions.schemas.TransactionSchema {
        return schemas.extend(schemas.transactionBaseSchema, {
            $id: "bridgechainUpdate",
            properties: {
                type: { transactionType: bridgechainUpdateType },
                amount: { bignumber: { minimum: 0, maximum: 0 } },
            },
        });
    }
    protected static defaultStaticFee = Utils.BigNumber.make(MarketplaceTransactionStaticFees.BridgechainUpdate);

    public serialize(): ByteBuffer {
        return new ByteBuffer(0);
    }

    public deserialize(buf: ByteBuffer): void {
        return;
    }
}
