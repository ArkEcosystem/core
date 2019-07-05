import { TransactionTypes } from "../../../enums";
import { Interfaces, Transactions, Utils } from "../../../index";

export class BusinessRegistrationBuilder extends Transactions.TransactionBuilder<BusinessRegistrationBuilder> {
    constructor() {
        super();
        this.data.type = TransactionTypes.BusinessRegistration;
        this.data.fee = Utils.BigNumber.make(500000000);
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { businessRegistration: {} };
    }

    public businessRegistrationAsset(name: string, website: string): BusinessRegistrationBuilder {
        this.data.asset.businessRegistration = {
            name,
            website,
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
