import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MarketplaceTransactionsGroup, MarketplaceTransactionTypes } from "../marketplace-transactions";
import { BridgechainUpdateTransaction } from "../transactions";

const bridgechainUpdateType: number = MarketplaceTransactionTypes.BridgechainUpdate;

export class BridgechainUpdateBuilder extends Transactions.TransactionBuilder<BridgechainUpdateBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MarketplaceTransactionsGroup;
        this.data.type = bridgechainUpdateType;
        this.data.fee = BridgechainUpdateTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { bridgechainUpdate: {} };
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BridgechainUpdateBuilder {
        return this;
    }
}
