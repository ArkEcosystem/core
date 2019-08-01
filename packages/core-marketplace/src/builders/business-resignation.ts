import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { MarketplaceTransactionTypes } from "../marketplace-transactions";
import { BusinessResignationTransaction } from "../transactions";

const businessResignationType: number = MarketplaceTransactionTypes.BusinessResignation;

export class BusinessResignationBuilder extends Transactions.TransactionBuilder<BusinessResignationBuilder> {
    constructor() {
        super();
        this.data.type = businessResignationType;
        this.data.fee = BusinessResignationTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { businessRegistration: {} };
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
