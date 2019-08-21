import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { IBusinessUpdateAsset } from "../interfaces";
import { MarketplaceTransactionGroup, MarketplaceTransactionType } from "../marketplace-transactions";
import { BusinessUpdateTransaction } from "../transactions";

const businessUpdateType: number = MarketplaceTransactionType.BusinessUpdate;

export class BusinessUpdateBuilder extends Transactions.TransactionBuilder<BusinessUpdateBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MarketplaceTransactionGroup;
        this.data.type = businessUpdateType;
        this.data.fee = BusinessUpdateTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { businessUpdate: {} };
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    public businessUpdateAsset(businessAsset: IBusinessUpdateAsset): BusinessUpdateBuilder {
        this.data.asset.businessUpdate = {
            name: businessAsset.name,
            website: businessAsset.website,
            vat: businessAsset.vat,
            repository: businessAsset.repository,
        };
        return this;
    }

    protected instance(): BusinessUpdateBuilder {
        return this;
    }
}
