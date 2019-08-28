import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MarketplaceTransactionGroup, MarketplaceTransactionType } from "../enums";
import { BusinessResignationTransaction } from "../transactions";

export class BusinessResignationBuilder extends Transactions.TransactionBuilder<BusinessResignationBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MarketplaceTransactionGroup;
        this.data.type = MarketplaceTransactionType.BusinessResignation;
        this.data.fee = BusinessResignationTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { businessResignation: {} };
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BusinessResignationBuilder {
        return this;
    }
}
