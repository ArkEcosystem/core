import { Interfaces, Transactions, Utils } from "@arkecosystem/crypto";
import { IBusinessRegistrationAsset } from "../interfaces";
import { MarketplaceTransactionGroup, MarketplaceTransactionType } from "../marketplace-transactions";
import { BusinessRegistrationTransaction } from "../transactions";

const businessRegistrationType: number = MarketplaceTransactionType.BusinessRegistration;

export class BusinessRegistrationBuilder extends Transactions.TransactionBuilder<BusinessRegistrationBuilder> {
    constructor() {
        super();
        this.data.version = 2;
        this.data.typeGroup = MarketplaceTransactionGroup;
        this.data.type = businessRegistrationType;
        this.data.fee = BusinessRegistrationTransaction.staticFee();
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { businessRegistration: {} };
    }

    public businessRegistrationAsset(businessAsset: IBusinessRegistrationAsset): BusinessRegistrationBuilder {
        this.data.asset.businessRegistration = {
            name: businessAsset.name,
            website: businessAsset.website,
            vat: businessAsset.vat,
            repository: businessAsset.repository,
        };
        return this;
    }

    public getStruct(): Interfaces.ITransactionData {
        const struct: Interfaces.ITransactionData = super.getStruct();
        struct.amount = this.data.amount;
        struct.asset = this.data.asset;
        return struct;
    }

    protected instance(): BusinessRegistrationBuilder {
        return this;
    }
}
