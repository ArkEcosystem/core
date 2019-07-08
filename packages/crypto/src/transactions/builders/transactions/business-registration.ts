import { TransactionTypes } from "../../../enums";
import { Interfaces, Utils } from "../../../index";
import { ITransactionAsset } from "../../../interfaces";
import { TransactionBuilder } from "./transaction";

export class BusinessRegistrationBuilder extends TransactionBuilder<BusinessRegistrationBuilder> {
    constructor() {
        super();
        this.data.type = TransactionTypes.BusinessRegistration;
        this.data.fee = Utils.BigNumber.make(TransactionTypes.BusinessRegistration);
        this.data.amount = Utils.BigNumber.ZERO;
        this.data.asset = { businessRegistration: {} } as ITransactionAsset;
    }

    public businessRegistrationAsset(name: string, websiteAddress: string): BusinessRegistrationBuilder {
        this.data.asset.businessRegistration = {
            name,
            websiteAddress,
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
